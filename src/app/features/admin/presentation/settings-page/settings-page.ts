import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TuiAppearance, TuiButton, TuiDialogService, TuiLoader } from '@taiga-ui/core';
import { TUI_CONFIRM, TuiSkeleton, TuiSwitch } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { defaultIfEmpty } from 'rxjs';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { AdminSpacesStore } from '../../application/admin-spaces.store';
import { AdminSpaceRepository } from '../../domain/admin-space.repository';
import type { SpaceClosure } from '../../domain/space-closure';
import { closuresThisMonth, mostFrequentReasonThisMonth } from '../../domain/space-closure-catalog';
import { MOCK_CLOSURES } from '../../infrastructure/mock-closures';
import { ClosureForm } from '../closure-form/closure-form';
import { ClosureHistory } from '../closure-history/closure-history';
import { closureReasonName } from '../closure-reason';
import { MetricCard } from '../metric-card/metric-card';

/**
 * `docs/booking-flow.md` §11 asks the panel to be able to "cancelar reservas del espacio, para
 * mantenimiento imprevisto, cierre anticipado o incidencias": this is the fourth and last of the
 * four things the document asks for.
 *
 * The two things the server can actually do about a space are here and are real: taking it out of
 * service, which is what stops it offering blocks (§10), and clearing the reservations it already
 * had. They are two actions rather than one because announcing next week's closure should not empty
 * today, and because a space can be handed back without anything to undo.
 *
 * The closure record below them — scope, reason, recurrence, history — is still a visual mock:
 * there is no closures API, and the server keeps a single flag per space. It stays until that
 * exists or until the product drops it; what it must not do is look like it were recording
 * anything.
 */
@Component({
  selector: 'app-settings-page',
  imports: [
    ClosureForm,
    ClosureHistory,
    FormsModule,
    MetricCard,
    TuiAppearance,
    TuiButton,
    TuiCardLarge,
    TuiLoader,
    TuiSkeleton,
    TuiSurface,
    TuiSwitch,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  public readonly spaceId = input.required<string>();

  private readonly spaces = inject(AdminSpacesStore);
  private readonly repository = inject(AdminSpaceRepository);
  private readonly dialogs = inject(TuiDialogService);
  private readonly notifications = inject(NotificationService);

  protected readonly space = rxResource({
    params: () => this.spaceId(),
    stream: ({ params }) => this.spaces.find(params),
    defaultValue: null,
  });

  protected readonly underMaintenance = computed(
    () => this.space.value()?.underMaintenance ?? false,
  );

  protected readonly switching = signal(false);
  protected readonly cancelling = signal(false);

  protected readonly closures = signal<readonly SpaceClosure[]>(MOCK_CLOSURES);

  protected readonly spaceClosures = computed(() =>
    this.closures().filter((closure) => closure.spaceId === this.spaceId()),
  );

  protected readonly closuresThisMonthCount = computed(() =>
    closuresThisMonth(this.spaceClosures(), new Date()),
  );

  protected readonly frequentReasonLabel = computed(() => {
    const reason = mostFrequentReasonThisMonth(this.spaceClosures(), new Date());

    return reason === null
      ? $localize`:@@admin.closure.stats.noReason:Sin cierres`
      : closureReasonName(reason);
  });

  protected addClosure(closure: SpaceClosure): void {
    this.closures.update((current) => [closure, ...current]);
  }

  /**
   * The switch does not carry the state: the server does. It is read again after the write so that
   * a failed one leaves the control showing what is true rather than what was asked for — the
   * catalogue's cache is dropped first, since that is where the flag is read from.
   */
  protected setMaintenance(underMaintenance: boolean): void {
    if (this.switching()) {
      return;
    }

    this.switching.set(true);

    this.repository.setMaintenance(this.spaceId(), underMaintenance).subscribe({
      next: () => {
        this.switching.set(false);
        this.refreshSpace();
        this.notifications.success(
          underMaintenance
            ? $localize`:@@admin.settings.maintenance.on:Espacio fuera de servicio`
            : $localize`:@@admin.settings.maintenance.off:Espacio disponible de nuevo`,
          underMaintenance
            ? $localize`:@@admin.settings.maintenance.onDetail:Ya no ofrece bloques. Las reservas que tuviera siguen en pie hasta que las canceles.`
            : $localize`:@@admin.settings.maintenance.offDetail:Vuelve a ofrecer sus bloques desde ahora.`,
        );
      },
      error: () => {
        this.switching.set(false);
        this.refreshSpace();
      },
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

  private refreshSpace(): void {
    this.spaces.refresh();
    this.space.reload();
  }
}
