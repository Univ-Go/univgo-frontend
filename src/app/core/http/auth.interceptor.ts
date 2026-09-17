import { HttpContextToken, HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { SessionStore } from '../../features/auth/application/session-store';
import { APP_CONFIG } from '../config/app-config';

/** Guards the retry against looping: a request may be replayed once, after one renewal. */
const RETRIED = new HttpContextToken<boolean>(() => false);

/**
 * The endpoints that mint or clear the session. A 401 from any of them is the answer, not a reason
 * to renew — renewing on `/auth/refresh` would call itself.
 */
const SESSION_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout'];

/**
 * Carries the session cookies and keeps them fresh. The renewal is reactive rather than scheduled
 * because the cookies are `HttpOnly`: nothing in the page can read when they expire, and a timer
 * would be guessing from the device clock.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const apiBaseUrl = inject(APP_CONFIG).apiBaseUrl;

  if (!request.url.startsWith(apiBaseUrl)) {
    return next(request);
  }

  const session = inject(SessionStore);
  const authenticated = request.clone({ withCredentials: true });

  return next(authenticated).pipe(
    catchError((cause: unknown) => {
      const isExpiredSession =
        cause instanceof HttpErrorResponse &&
        cause.status === 401 &&
        !request.context.get(RETRIED) &&
        !SESSION_ENDPOINTS.some((endpoint) => request.url.endsWith(endpoint));

      if (!isExpiredSession) {
        return throwError(() => cause);
      }

      return session.renew().pipe(
        switchMap(() =>
          next(authenticated.clone({ context: authenticated.context.set(RETRIED, true) })),
        ),
        catchError(() => {
          session.expire();
          return throwError(() => cause);
        }),
      );
    }),
  );
};
