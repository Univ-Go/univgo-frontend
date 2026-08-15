import { Injectable } from '@angular/core';

export type LogContext = Readonly<Record<string, unknown>>;

/**
 * Diagnostics port. Callers must pass only technical context — never credentials, tokens or
 * personal data — because adapters may forward it to an external collector.
 */
export abstract class Logger {
  abstract warn(message: string, context?: LogContext): void;
  abstract error(message: string, context?: LogContext): void;
}

/**
 * Default adapter. Swapping this for a remote collector is a provider change in `app.config.ts`
 * and requires no modification to the code that reports errors.
 */
@Injectable()
export class ConsoleLogger extends Logger {
  warn(message: string, context?: LogContext): void {
    console.warn(message, context ?? {});
  }

  error(message: string, context?: LogContext): void {
    console.error(message, context ?? {});
  }
}
