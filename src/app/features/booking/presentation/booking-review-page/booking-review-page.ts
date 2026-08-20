import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiAppearance, TuiButton, TuiIcon, TuiLink } from '@taiga-ui/core';
import { TuiCardLarge, TuiList, TuiSurface } from '@taiga-ui/layout';
import { MediaPlate } from '../../../../shared/media-plate/media-plate';
import { spaceCategoryIcon, spaceCategoryRules } from '../../../spaces/presentation/space-category';
import { BookingDraftStore } from '../../application/booking-draft.store';
import { formatBookingRange } from '../booking-time';

/**
 * Step three: everything the flow agreed on, in one place, with a way back to whichever step owns
 * each piece. The shortcuts navigate rather than edit — a field that could be changed here would be
 * a second place where a booking is composed, and the two would drift.
 *
 * `bookingScheduledGuard` is what makes the view total: it only renders for a draft that already
 * has a space, a day and an hour.
 */
@Component({
  selector: 'app-booking-review-page',
  imports: [
    DatePipe,
    MediaPlate,
    RouterLink,
    TuiAppearance,
    TuiButton,
    TuiCardLarge,
    TuiIcon,
    TuiLink,
    TuiList,
    TuiSurface,
  ],
  templateUrl: './booking-review-page.html',
  styleUrl: './booking-review-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingReviewPage {
  private readonly router = inject(Router);
  private readonly draft = inject(BookingDraftStore);

  protected readonly booking = this.draft.booking;

  protected readonly icon = computed(() => {
    const booking = this.booking();

    return booking ? spaceCategoryIcon(booking.space.category) : '';
  });

  protected readonly rules = computed(() => {
    const booking = this.booking();

    return booking ? spaceCategoryRules(booking.space.category) : [];
  });

  protected readonly range = computed(() => {
    const booking = this.booking();

    return booking ? formatBookingRange(booking.startMinutes, booking.endMinutes) : '';
  });

  protected readonly scheduleLink = computed(() => {
    const booking = this.booking();

    return booking ? ['/book', booking.space.id, 'when'] : ['/book', 'space'];
  });

  /**
   * Three "Cambiar" links on one page tell a screen reader nothing about where each goes, so each
   * one names its own destination.
   */
  protected readonly changeSpaceLabel = $localize`:@@booking.review.changeSpaceLabel:Cambiar el espacio`;
  protected readonly changeScheduleLabel = $localize`:@@booking.review.changeScheduleLabel:Cambiar la fecha y la hora`;

  protected create(): void {
    this.draft.confirm();

    if (this.draft.reservationCode()) {
      void this.router.navigate(['/book', 'done'], { replaceUrl: true });
    }
  }
}
