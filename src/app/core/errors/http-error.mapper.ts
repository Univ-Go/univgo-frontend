import { HttpErrorResponse } from '@angular/common/http';
import type { AppErrorCode } from './app-error';

const STATUS_TO_ERROR_CODE = new Map<number, AppErrorCode>([
  [400, 'validation'],
  [401, 'unauthorized'],
  [403, 'forbidden'],
  [404, 'notFound'],
  [409, 'conflict'],
  [422, 'validation'],
  [429, 'rateLimited'],
]);

/** A status of 0 means the request never reached the server (offline, DNS, CORS, timeout). */
const NO_RESPONSE_STATUS = 0;

export function mapHttpStatusToErrorCode(status: number): AppErrorCode {
  if (status === NO_RESPONSE_STATUS) {
    return 'network';
  }

  const mapped = STATUS_TO_ERROR_CODE.get(status);
  if (mapped) {
    return mapped;
  }

  return status >= 500 ? 'server' : 'unknown';
}

/**
 * Backends are expected to echo a correlation identifier; it is the one piece of the response we
 * let the user see, because support needs a way to find the matching server-side log entry.
 */
export function readErrorReference(response: HttpErrorResponse): string | undefined {
  return response.headers?.get('X-Correlation-Id') ?? undefined;
}
