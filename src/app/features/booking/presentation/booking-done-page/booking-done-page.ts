import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiAppearance, TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { BookingDraftStore } from '../../application/booking-draft.store';
import { formatBookingRange } from '../booking-time';

/**
 * The outcome of the flow, and the only screen in it without a stepper: there is no step four, and
 * showing one would suggest the booking still needs something.
 *
 * It shows less than the review step on purpose — what a person needs in order to find the place at
 * the right time, plus the code that identifies the booking — and offers the two things anyone
 * wants next: the list where the booking now lives, or the way out.
 */
@Component({
  selector: 'app-booking-done-page',
  imports: [
    DatePipe,
    RouterLink,
    TuiAppearance,
    TuiAvatar,
    TuiButton,
    TuiCardLarge,
    TuiIcon,
    TuiSurface,
  ],
  templateUrl: './booking-done-page.html',
  styleUrl: './booking-done-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingDonePage {
  private readonly draft = inject(BookingDraftStore);

  protected readonly booking = this.draft.booking;
  protected readonly code = this.draft.reservationCode;

  protected readonly range = computed(() => {
    const booking = this.booking();

    return booking ? formatBookingRange(booking.startMinutes, booking.endMinutes) : '';
  });
}
