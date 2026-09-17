import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Router } from '@angular/router';
import { type Observable, of } from 'rxjs';
import type { AuthenticatedUser } from '../domain/session';
import { adminGuard, guestGuard, studentGuard } from './auth.guards';
import { SessionStore } from './session-store';

const STUDENT: AuthenticatedUser = {
  id: 'f2e1',
  identification: '1234567890',
  email: 'sofia.ramirez@univgo.edu',
  firstName: 'Sofía',
  lastName: 'Ramírez',
  role: 'student',
};

const ADMIN: AuthenticatedUser = { ...STUDENT, role: 'admin' };

const ROUTE = {} as ActivatedRouteSnapshot;
const STATE = { url: '/reservations' } as RouterStateSnapshot;

function firstValue<T>(source: Observable<T>): Promise<T> {
  return new Promise<T>((resolve) => source.subscribe(resolve));
}

describe('auth guards', () => {
  let createUrlTree: ReturnType<typeof vi.fn>;
  let parseUrl: ReturnType<typeof vi.fn>;

  function withSession(user: AuthenticatedUser | null): void {
    TestBed.configureTestingModule({
      providers: [
        { provide: SessionStore, useValue: { ensureRestored: () => of(user) } },
        { provide: Router, useValue: { createUrlTree, parseUrl } },
      ],
    });
  }

  function run(guard: typeof studentGuard): Observable<boolean | UrlTree> {
    return TestBed.runInInjectionContext(
      () => guard(ROUTE, STATE) as Observable<boolean | UrlTree>,
    );
  }

  beforeEach(() => {
    createUrlTree = vi.fn((commands: unknown[]) => commands);
    parseUrl = vi.fn((url: string) => url);
  });

  describe('studentGuard', () => {
    it('lets a student into their portal', async () => {
      withSession(STUDENT);

      await expect(firstValue(run(studentGuard))).resolves.toBe(true);
    });

    it('sends an administrator back to the panel instead of the student portal', async () => {
      withSession(ADMIN);

      await firstValue(run(studentGuard));

      expect(parseUrl).toHaveBeenCalledWith('/admin');
      expect(createUrlTree).not.toHaveBeenCalled();
    });

    it('sends a visitor to sign in, remembering where they were headed', async () => {
      withSession(null);

      await firstValue(run(studentGuard));

      expect(createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { redirect: '/reservations' },
      });
    });
  });

  describe('adminGuard', () => {
    it('lets an administrator into the panel', async () => {
      withSession(ADMIN);

      await expect(firstValue(run(adminGuard))).resolves.toBe(true);
    });

    it('returns a student to their own portal rather than refusing them', async () => {
      withSession(STUDENT);

      await firstValue(run(adminGuard));

      expect(parseUrl).toHaveBeenCalledWith('/home');
      expect(createUrlTree).not.toHaveBeenCalled();
    });

    it('sends a visitor to sign in', async () => {
      withSession(null);

      await firstValue(run(adminGuard));

      expect(createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { redirect: '/reservations' },
      });
    });
  });

  describe('guestGuard', () => {
    it('lets a visitor reach the sign-in form', async () => {
      withSession(null);

      await expect(firstValue(run(guestGuard))).resolves.toBe(true);
    });

    it('forwards a signed-in administrator to the panel', async () => {
      withSession(ADMIN);

      await firstValue(run(guestGuard));

      expect(parseUrl).toHaveBeenCalledWith('/admin');
    });

    it('forwards a signed-in student to their portal', async () => {
      withSession(STUDENT);

      await firstValue(run(guestGuard));

      expect(parseUrl).toHaveBeenCalledWith('/home');
    });
  });
});
