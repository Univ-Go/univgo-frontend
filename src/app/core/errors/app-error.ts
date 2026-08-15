/**
 * The vocabulary of failures the interface knows how to talk about. Transport-level details
 * (status codes, exception payloads, stack traces) are deliberately collapsed into these cases so
 * nothing technical can reach a template by accident.
 */
export type AppErrorCode =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'validation'
  | 'rateLimited'
  | 'server'
  | 'unknown';

/**
 * The only error shape allowed to cross into the presentation layer. It carries no raw cause: the
 * technical detail is handed to the Logger at the point of mapping, which keeps user-facing
 * feedback and developer diagnostics structurally separate.
 */
export interface AppError {
  readonly code: AppErrorCode;
  /** Surfaced to the user only as a reference to quote when contacting support. */
  readonly reference?: string;
}

export function createAppError(code: AppErrorCode, reference?: string): AppError {
  return { code, reference };
}

export function isAppError(value: unknown): value is AppError {
  return typeof value === 'object' && value !== null && 'code' in value;
}
