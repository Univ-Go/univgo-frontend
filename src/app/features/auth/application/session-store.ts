import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { type Observable, catchError, finalize, of, shareReplay, tap } from 'rxjs';
import { createAppError } from '../../../core/errors/app-error';
import { NotificationService } from '../../../core/notifications/notification.service';
import { AuthRepository, type Credentials } from '../domain/auth.repository';
import { type AuthenticatedUser, landingPathFor } from '../domain/session';

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

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
   * Shared between every guard of a single navigation, so a route tree with three of them still
   * asks the server once.
   */
  ensureRestored(): Observable<AuthenticatedUser | null> {
    if (this.currentStatus() !== 'unknown') {
      return of(this.state());
    }

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
    const wasAuthenticated = this.currentStatus() === 'authenticated';
    this.forget();

    if (wasAuthenticated) {
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
  }

  private forget(): void {
    this.state.set(null);
    this.currentStatus.set('anonymous');
  }
}
