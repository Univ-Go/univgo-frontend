import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiAppearance, TuiButton, TuiIcon, TuiLink } from '@taiga-ui/core';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { MediaPlate } from '../../../../shared/media-plate/media-plate';
import { formatTimeRange } from '../../../../shared/time/time-of-day';
import { spaceCategoryIcon } from '../../../spaces/presentation/space-category';
import { type Reservation, hasUsablePass, isCancellable } from '../../domain/reservation';
import { ReservationInterruptionNotice } from '../reservation-interruption-notice/reservation-interruption-notice';
import { ReservationStatusBadge } from '../reservation-status-badge/reservation-status-badge';

/**
 * Feature-level card: every view that lists reservations renders the same summary, so the state
 * badge mapping and the action bar live in one place rather than being copied per view. It stays
 * inside `my-reservations` until a second feature needs it; the home view's "next reservation" is a
 * different composition, not this card with flags.
 *
 * Which actions a booking offers is read from the domain, not from the card: a finished or
 * cancelled one has nothing left to give up and no pass worth showing, and a button that is there
 * only to be refused by the server is a promise the interface cannot keep.
 *
 * Cancelling is emitted rather than performed here: the confirmation and the reload belong to the
 * view that owns the list, and a card that cancelled on its own would leave the list it sits in
 * showing something else.
 */
@Component({
  selector: 'app-reservation-card',
  imports: [
    DatePipe,
    MediaPlate,
    ReservationInterruptionNotice,
    ReservationStatusBadge,
    RouterLink,
    TuiAppearance,
    TuiButton,
    TuiCardLarge,
    TuiIcon,
    TuiLink,
    TuiSurface,
  ],
  templateUrl: './reservation-card.html',
  styleUrl: './reservation-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationCard {
  public readonly reservation = input.required<Reservation>();

  /** True while this booking's cancellation is in flight, so the card cannot ask for it twice. */
  public readonly cancelling = input(false);

  public readonly cancelled = output<Reservation>();

  protected readonly icon = computed(() => spaceCategoryIcon(this.reservation().category));

  protected readonly range = computed(() =>
    formatTimeRange(this.reservation().startMinutes, this.reservation().endMinutes),
  );

  protected readonly canCancel = computed(() => isCancellable(this.reservation()));

  protected readonly hasPass = computed(() => hasUsablePass(this.reservation()));
}
