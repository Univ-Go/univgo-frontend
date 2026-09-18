import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TuiNotification, TuiTitle } from '@taiga-ui/core';
import { closureReasonName } from '../../../spaces/presentation/closure-reason';
import { type Reservation, interruptionOf } from '../../domain/reservation';

/**
 * Level 2: what the badge cannot say on its own — that somebody other than the student stopped the
 * booking, and why (`docs/booking-flow.md` §12). The card and the detail view both show it, so the
 * wording lives once here. It renders nothing for a booking nobody interrupted.
 *
 * A static notice rather than an alert: it describes the booking for as long as it stands, not an
 * event that just happened.
 */
@Component({
  selector: 'app-reservation-interruption-notice',
  imports: [TuiNotification, TuiTitle],
  templateUrl: './reservation-interruption-notice.html',
  styleUrl: './reservation-interruption-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationInterruptionNotice {
  public readonly reservation = input.required<Reservation>();

  /** The detail view has room to say what the student can do next; the card only says what happened. */
  public readonly explained = input(false);

  protected readonly interruption = computed(() => interruptionOf(this.reservation()));

  protected readonly reason = computed(() => closureReasonName(this.reservation().closureReason));
}
