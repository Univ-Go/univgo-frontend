import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { type UserRole, landingPathFor } from '../domain/session';
import { SessionStore } from './session-store';

/**
 * The two portals are separate products behind one sign-in: a student has no business in the desk
 * tool, and an administrator signed in to run a counter should not be browsing the catalogue from
 * the same session. Landing on the wrong one is not an error to report, just a wrong door — it
 * returns the person to their own portal instead of telling them what they cannot see.
 */
function requireRole(role: UserRole): CanActivateFn {
  return (_route, state) => {
    const session = inject(SessionStore);
    const router = inject(Router);

    return session.ensureRestored().pipe(
      map((user) => {
        if (!user) {
          return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
        }

        return user.role === role || router.parseUrl(landingPathFor(user.role));
      }),
    );
  };
}

export const studentGuard = requireRole('student');

export const adminGuard = requireRole('admin');

/** Keeps a signed-in person off the sign-in form, which would otherwise offer to replace a session. */
export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionStore);
  const router = inject(Router);

  return session
    .ensureRestored()
    .pipe(map((user) => !user || router.parseUrl(landingPathFor(user.role))));
};
