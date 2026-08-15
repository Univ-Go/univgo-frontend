import { Injectable, inject } from '@angular/core';
import { TuiNotificationService } from '@taiga-ui/core';
import type { AppError } from '../errors/app-error';
import { resolveErrorMessage } from '../errors/error-message.resolver';

type NotificationAppearance = 'info' | 'negative' | 'positive' | 'warning';

const TRANSIENT_LIFE_MS = 4000;
/** Failures need longer on screen: the user has to read a recovery step, not just an outcome. */
const ERROR_LIFE_MS = 8000;

/**
 * The single entry point for transient user feedback. Wrapping Taiga's notification service keeps
 * alert configuration in one place and guarantees that errors are translated through
 * `resolveErrorMessage` instead of being rendered raw.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly notifications = inject(TuiNotificationService);

  success(summary: string, detail?: string): void {
    this.show('positive', TRANSIENT_LIFE_MS, summary, detail);
  }

  info(summary: string, detail?: string): void {
    this.show('info', TRANSIENT_LIFE_MS, summary, detail);
  }

  warn(summary: string, detail?: string): void {
    this.show('warning', TRANSIENT_LIFE_MS, summary, detail);
  }

  error(error: AppError): void {
    const { summary, detail } = resolveErrorMessage(error.code);

    this.show(
      'negative',
      ERROR_LIFE_MS,
      summary,
      error.reference ? `${detail} ${this.referenceHint(error.reference)}` : detail,
    );
  }

  private show(
    appearance: NotificationAppearance,
    autoClose: number,
    summary: string,
    detail?: string,
  ): void {
    // `label` es el encabezado de la alerta y el contenido es el cuerpo: un aviso sin detalle se
    // lee mejor como una sola línea que como un título sobre un bloque vacío.
    this.notifications
      .open(detail ?? summary, { appearance, autoClose, label: detail ? summary : '' })
      .subscribe();
  }

  private referenceHint(reference: string): string {
    return $localize`:@@error.reference:Referencia: ${reference}:reference:`;
  }
}
