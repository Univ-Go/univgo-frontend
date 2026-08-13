import { HttpContextToken, HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { createAppError } from '../errors/app-error';
import { mapHttpStatusToErrorCode, readErrorReference } from '../errors/http-error.mapper';
import { Logger } from '../logging/logger';
import { NotificationService } from '../notifications/notification.service';

/**
 * Opt out when a caller renders the failure itself (inline form errors, a retry panel), so the
 * user is not told the same thing twice.
 */
export const SKIP_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);

/**
 * Notifying by default is deliberate: forgetting to handle a rejected request degrades into a
 * silent failure, which is the one outcome the user can never recover from.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const logger = inject(Logger);
  const notifications = inject(NotificationService);

  return next(request).pipe(
    catchError((cause: unknown) => {
      const response = cause instanceof HttpErrorResponse ? cause : undefined;
      const code = response ? mapHttpStatusToErrorCode(response.status) : 'unknown';
      const appError = createAppError(code, response && readErrorReference(response));

      logger.error('HTTP request failed', {
        code,
        status: response?.status,
        method: request.method,
        // Params are omitted on purpose: query strings can carry tokens or personal data.
        url: request.url,
        reference: appError.reference,
      });

      if (!request.context.get(SKIP_ERROR_NOTIFICATION)) {
        notifications.error(appError);
      }

      return throwError(() => appError);
    }),
  );
};
