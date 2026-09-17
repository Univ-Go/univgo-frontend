import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TuiItem } from '@taiga-ui/cdk';
import { TuiAppearance, TuiButton, TuiDialog, TuiIcon, TuiLink } from '@taiga-ui/core';
import type { TuiDialogOptions } from '@taiga-ui/core';
import { TuiBreadcrumbs, TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiList, TuiSurface } from '@taiga-ui/layout';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { MediaPlate } from '../../../../shared/media-plate/media-plate';
import { formatTimeRange } from '../../../../shared/time/time-of-day';
import { spaceCategoryIcon, spaceCategoryRules } from '../../../spaces/presentation/space-category';
import { isActive } from '../../domain/reservation';
import { ReservationRepository } from '../../domain/reservation.repository';
import { ReservationStatusBadge } from '../reservation-status-badge/reservation-status-badge';

/**
 * One booking in full, with the pass that gets it through the door. `id` is bound from the `:id`
 * route param and `pass` from the query string via `withComponentInputBinding()`, so no
 * `ActivatedRoute` injection is needed here.
 *
 * Three outcomes, and each is its own state: the booking, a booking that is not there — a stale
 * link, or somebody else's, which the server answers the same way on purpose — and a read that
 * failed, which is the only one worth offering a retry for.
 */
@Component({
  selector: 'app-reservation-detail-page',
  imports: [
    DatePipe,
    EmptyState,
    MediaPlate,
    ReservationStatusBadge,
    RouterLink,
    TuiAppearance,
    TuiBreadcrumbs,
    TuiButton,
    TuiCardLarge,
    TuiDialog,
    TuiIcon,
    TuiItem,
    TuiLink,
    TuiList,
    TuiSkeleton,
    TuiSurface,
  ],
  templateUrl: './reservation-detail-page.html',
  styleUrl: './reservation-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationDetailPage {
  public readonly id = input<string>();

  /** `?pass=1`, which is how the list's "Ver QR" opens the pass straight away instead of copying it. */
  public readonly pass = input(false, { transform: booleanAttribute });

  private readonly repository = inject(ReservationRepository);

  protected readonly resource = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.repository.findById(params ?? ''),
    defaultValue: null,
  });

  protected readonly reservation = this.resource.value;

  protected readonly categoryIcon = spaceCategoryIcon;

  protected readonly range = computed(() => {
    const reservation = this.reservation();

    return reservation ? formatTimeRange(reservation.startMinutes, reservation.endMinutes) : '';
  });

  protected readonly rules = computed(() => {
    const reservation = this.reservation();

    return reservation ? spaceCategoryRules(reservation.category) : [];
  });

  /** A pass that can no longer be scanned is history, so the check-in window goes with it. */
  protected readonly showsPass = computed(() => {
    const reservation = this.reservation();

    return reservation !== null && isActive(reservation);
  });

  /** Follows the link that asked for it, and closing the dialog is still the viewer's to do. */
  protected readonly qrOpen = linkedSignal(() => this.pass() && this.showsPass());

  /**
   * A screen held out at a reception desk is read at arm's length, so the pass gets the largest
   * dialog size. The directive writes `false` back into `qrOpen` when the dialog closes.
   */
  protected readonly qrDialogOptions: Partial<TuiDialogOptions<void>> = {
    size: 'l',
    label: $localize`:@@reservations.detail.pass.dialogTitle:Código QR de tu reserva`,
  };
}
