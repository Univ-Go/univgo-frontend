import { HttpContextToken, HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { type AppError, createAppError } from '../errors/app-error';
import { mapHttpStatusToErrorCode, readErrorReference } from '../errors/http-error.mapper';
import { Logger } from '../logging/logger';
import { NotificationService } from '../notifications/notification.service';

/**
 * Opt out when a caller renders the failure itself (inline form errors, a retry panel), so the
 * user is not told the same thing twice.
 */
export const SKIP_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);

/**
 * Opt out of the AppError conversion when the caller must read the server's body to tell refusals
 * apart. The raw `HttpErrorResponse` is handed on as-is, and the caller maps the rest with
 * `toAppError`. Logging still happens here.
 */
export const KEEP_HTTP_ERROR_RESPONSE = new HttpContextToken<boolean>(() => false);

export function toAppError(cause: unknown): AppError {
  const response = cause instanceof HttpErrorResponse ? cause : undefined;
  const code = response ? mapHttpStatusToErrorCode(response.status) : 'unknown';

  return createAppError(code, response && readErrorReference(response));
}

/**
 * Notifying by default is deliberate: forgetting to handle a rejected request degrades into a
 * silent failure, which is the one outcome the user can never recover from.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const logger = inject(Logger);
  const notifications = inject(NotificationService);

  return next(request).pipe(
    catchError((cause: unknown) => {
      const appError = toAppError(cause);

      logger.error('HTTP request failed', {
        code: appError.code,
        status: cause instanceof HttpErrorResponse ? cause.status : undefined,
        method: request.method,
        // Params are omitted on purpose: query strings can carry tokens or personal data.
        url: request.url,
        reference: appError.reference,
      });

      if (request.context.get(KEEP_HTTP_ERROR_RESPONSE)) {
        return throwError(() => cause);
      }

      // 401 is the one status this interceptor stays quiet about: `SessionStore` owns the
      // expiry message, and it can tell a session that ran out from a visitor who never had
      // one. Notifying here as well would say it twice, or say it to the wrong person.
      if (appError.code !== 'unauthorized' && !request.context.get(SKIP_ERROR_NOTIFICATION)) {
        notifications.error(appError);
      }

      return throwError(() => appError);
    }),
  );
};
