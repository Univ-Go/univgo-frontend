import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TuiAppearance, TuiButton, TuiDialogService, TuiLoader } from '@taiga-ui/core';
import { TUI_CONFIRM } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { defaultIfEmpty } from 'rxjs';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { AdminSpaceRepository } from '../../domain/admin-space.repository';
import type { SpaceClosure } from '../../domain/space-closure';
import { closuresThisMonth, mostFrequentReasonThisMonth } from '../../domain/space-closure-catalog';
import type { ClosureRequest } from '../../domain/space-closure.repository';
import { SpaceClosureRepository } from '../../domain/space-closure.repository';
import { ClosureForm } from '../closure-form/closure-form';
import { ClosureHistory } from '../closure-history/closure-history';
import { closureReasonName } from '../closure-reason';
import { MetricCard } from '../metric-card/metric-card';

/**
 * `docs/booking-flow.md` §11 asks the panel to be able to "cancelar reservas del espacio, para
 * mantenimiento imprevisto, cierre anticipado o incidencias": this is the fourth and last of the
 * four things the document asks for.
 *
 * The closure record comes first: a window, a reason, and the way back from it. Taking a space out
 * of service is one of them — a closure with no end date — so it has no switch of its own. A closure
 * suspends rather than cancels (§12), which is what makes reopening possible, and that is why
 * clearing the space's reservations stays a separate, final action below it.
 */
@Component({
  selector: 'app-settings-page',
  imports: [
    ClosureForm,
    ClosureHistory,
    MetricCard,
    TuiAppearance,
    TuiButton,
    TuiCardLarge,
    TuiLoader,
    TuiSurface,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  public readonly spaceId = input.required<string>();

  private readonly repository = inject(AdminSpaceRepository);
  private readonly closureRepository = inject(SpaceClosureRepository);
  private readonly dialogs = inject(TuiDialogService);
  private readonly notifications = inject(NotificationService);

  protected readonly cancelling = signal(false);
  protected readonly closing = signal(false);
  protected readonly revertingId = signal<string | null>(null);

  protected readonly closures = rxResource({
    params: () => this.spaceId(),
    stream: ({ params }) => this.closureRepository.closuresOf(params),
    defaultValue: [],
  });

  protected readonly closuresThisMonthCount = computed(() =>
    closuresThisMonth(this.closures.value(), new Date()),
  );

  protected readonly frequentReasonLabel = computed(() => {
    const reason = mostFrequentReasonThisMonth(this.closures.value(), new Date());

    return reason === null
      ? $localize`:@@admin.closure.stats.noReason:Sin cierres`
      : closureReasonName(reason);
  });

  protected close(request: ClosureRequest): void {
    if (this.closing()) {
      return;
    }

    this.closing.set(true);

    this.closureRepository.close(this.spaceId(), request).subscribe({
      next: () => {
        this.closing.set(false);
        this.closures.reload();
        this.notifications.success(
          $localize`:@@admin.closure.created.summary:Espacio cerrado`,
          $localize`:@@admin.closure.created.detail:Las reservas de ese periodo quedan suspendidas y vuelven si lo reabres.`,
        );
      },
      error: () => this.closing.set(false),
    });
  }

  protected revert(closure: SpaceClosure): void {
    if (this.revertingId()) {
      return;
    }

    this.revertingId.set(closure.id);

    this.closureRepository.revert(this.spaceId(), closure.id).subscribe({
      next: () => {
        this.revertingId.set(null);
        this.closures.reload();
        this.notifications.success(
          $localize`:@@admin.closure.reverted.summary:Espacio reabierto`,
          $localize`:@@admin.closure.reverted.detail:Las reservas que estaban suspendidas vuelven a estar en pie.`,
        );
      },
      error: () => this.revertingId.set(null),
    });
  }

  protected confirmCancelAll(): void {
    if (this.cancelling()) {
      return;
    }

    this.dialogs
      .open<boolean>(TUI_CONFIRM, {
        size: 's',
        label: $localize`:@@admin.settings.cancelAll.title:¿Cancelar todas las reservas de este espacio?`,
        data: {
          content: $localize`:@@admin.settings.cancelAll.content:Se cancelarán las reservas que no hayan terminado. Los estudiantes las verán como canceladas y podrán reservar en otro sitio.`,
          yes: $localize`:@@admin.settings.cancelAll.confirm:Cancelar las reservas`,
          no: $localize`:@@admin.settings.cancelAll.keep:Dejarlas como están`,
          appearance: 'primary-destructive',
        },
      })
      .pipe(defaultIfEmpty(false))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.cancelAll();
        }
      });
  }

  private cancelAll(): void {
    this.cancelling.set(true);

    this.repository.cancelAllReservations(this.spaceId()).subscribe({
      next: (cancelled) => {
        this.cancelling.set(false);
        this.notifications.success(
          $localize`:@@admin.settings.cancelAll.done:Reservas canceladas`,
          $localize`:@@admin.settings.cancelAll.doneDetail:Plazas liberadas: ${cancelled}:count:`,
        );
      },
      error: () => this.cancelling.set(false),
    });
  }
}
