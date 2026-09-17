import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { type Observable, catchError, finalize, of, shareReplay, tap } from 'rxjs';
import { createAppError } from '../../../core/errors/app-error';
import { NotificationService } from '../../../core/notifications/notification.service';
import { AuthRepository, type Credentials } from '../domain/auth.repository';
import { type AuthenticatedUser, landingPathFor } from '../domain/session';

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

const SESSION_HINT = 'univgo.session';

/**
 * The single answer to "who is using the application". `unknown` is a real state and not a default:
 * before asking the server, an absent user and a user we have not looked up yet are different
 * things, and treating them alike would sign people out on every reload.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly repository = inject(AuthRepository);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  private readonly state = signal<AuthenticatedUser | null>(null);
  private readonly currentStatus = signal<SessionStatus>('unknown');

  private restoring?: Observable<AuthenticatedUser | null>;
  private renewal?: Observable<AuthenticatedUser>;

  readonly user = this.state.asReadonly();
  readonly status = this.currentStatus.asReadonly();
  readonly isAuthenticated = computed(() => this.currentStatus() === 'authenticated');

  /**
   * Asks the server on every navigation rather than trusting what it learned once: the cookies are
   * `HttpOnly`, so their expiry is unreadable here and a cached answer would let someone walk
   * through the application on a session that ended minutes ago. The single-flight keeps a route
   * tree with three guards down to one request, and a session whose access cookie merely lapsed is
   * renewed by the interceptor without this ever seeing a failure.
   */
  ensureRestored(): Observable<AuthenticatedUser | null> {
    this.restoring ??= this.repository.currentUser().pipe(
      tap((user) => this.adopt(user)),
      catchError(() => {
        this.forget();
        return of(null);
      }),
      finalize(() => {
        this.restoring = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.restoring;
  }

  /**
   * Also single-flight: several requests failing at once must produce one renewal, not one each,
   * because the server rotates the refresh token and treats a replayed one as a stolen one.
   */
  renew(): Observable<AuthenticatedUser> {
    this.renewal ??= this.repository.renew().pipe(
      tap((user) => this.adopt(user)),
      finalize(() => {
        this.renewal = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.renewal;
  }

  signIn(credentials: Credentials): Observable<AuthenticatedUser> {
    return this.repository.signIn(credentials).pipe(tap((user) => this.adopt(user)));
  }

  signOut(): Observable<void> {
    // The cookies are cleared by the server, so the local state follows either way: a failed
    // request must not leave someone looking signed in with no session behind it.
    return this.repository.signOut().pipe(
      finalize(() => {
        this.forget();
        this.rememberSignedIn(false);
        void this.router.navigateByUrl('/login');
      }),
    );
  }

  /**
   * Both credentials ran out. Announcing it is this class's job alone — the HTTP error interceptor
   * stays quiet on 401 precisely so the message appears once, whether it surfaced from a reload or
   * from a request in flight.
   */
  expire(): void {
    const hadSession = this.currentStatus() === 'authenticated' || this.wasSignedIn();
    this.forget();
    this.rememberSignedIn(false);

    if (hadSession) {
      this.notifications.error(createAppError('unauthorized'));
      void this.router.navigateByUrl('/login');
    }
  }

  landingPath(): string {
    const user = this.state();
    return user ? landingPathFor(user.role) : '/login';
  }

  private adopt(user: AuthenticatedUser): void {
    this.state.set(user);
    this.currentStatus.set('authenticated');
    this.rememberSignedIn(true);
  }

  /**
   * A reload starts with no state at all, so without this an expired session and a first-time
   * visitor look identical and the wrong one gets told their session ran out. The flag says only
   * that a session once existed — it is not a credential and grants nothing.
   */
  private wasSignedIn(): boolean {
    try {
      return localStorage.getItem(SESSION_HINT) !== null;
    } catch {
      return false;
    }
  }

  private rememberSignedIn(value: boolean): void {
    try {
      if (value) {
        localStorage.setItem(SESSION_HINT, '1');
      } else {
        localStorage.removeItem(SESSION_HINT);
      }
    } catch {
      // Private browsing or blocked storage: the flag is an improvement to the message, not a
      // requirement for signing in.
    }
  }

  private forget(): void {
    this.state.set(null);
    this.currentStatus.set('anonymous');
  }
}
