import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import type { AppError } from '../errors/app-error';
import { resolveErrorMessage } from '../errors/error-message.resolver';

const TRANSIENT_LIFE_MS = 4000;
/** Failures need longer on screen: the user has to read a recovery step, not just an outcome. */
const ERROR_LIFE_MS = 8000;

/**
 * The single entry point for transient user feedback. Wrapping PrimeNG's MessageService keeps
 * toast configuration in one place and guarantees that errors are translated through
 * `resolveErrorMessage` instead of being rendered raw.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messages = inject(MessageService);

  success(summary: string, detail?: string): void {
    this.messages.add({ severity: 'success', summary, detail, life: TRANSIENT_LIFE_MS });
  }

  info(summary: string, detail?: string): void {
    this.messages.add({ severity: 'info', summary, detail, life: TRANSIENT_LIFE_MS });
  }

  warn(summary: string, detail?: string): void {
    this.messages.add({ severity: 'warn', summary, detail, life: TRANSIENT_LIFE_MS });
  }

  error(error: AppError): void {
    const { summary, detail } = resolveErrorMessage(error.code);

    this.messages.add({
      severity: 'error',
      summary,
      detail: error.reference ? `${detail} ${this.referenceHint(error.reference)}` : detail,
      life: ERROR_LIFE_MS,
    });
  }

  private referenceHint(reference: string): string {
    return $localize`:@@error.reference:Referencia: ${reference}:reference:`;
  }
}
