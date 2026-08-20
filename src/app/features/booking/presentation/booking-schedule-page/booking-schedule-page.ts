import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TuiAppearance, TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiChip } from '@taiga-ui/kit';
import { TuiCardLarge, TuiList, TuiSurface } from '@taiga-ui/layout';
import { MediaPlate } from '../../../../shared/media-plate/media-plate';
import {
  spaceCategoryIcon,
  spaceCategoryName,
  spaceCategoryRules,
} from '../../../spaces/presentation/space-category';
import { BookingDraftStore } from '../../application/booking-draft.store';
import { formatBookingRange } from '../booking-time';
import { BookingSlotPicker } from '../booking-slot-picker/booking-slot-picker';

/**
 * Step two: when. The space is settled by the time this view renders — `bookingSpaceGuard` puts it
 * in the draft, whether it arrived from the catalogue's card or from step one — so the page is only
 * ever asking one question, and the left column exists to answer "is this the right space?" while
 * the right one collects the answer.
 *
 * Nothing here is stored locally: the draft outlives the view, which is what lets step three send
 * the user back to change an hour and find the rest of the booking still filled in.
 */
@Component({
  selector: 'app-booking-schedule-page',
  imports: [
    BookingSlotPicker,
    DatePipe,
    MediaPlate,
    TuiAppearance,
    TuiButton,
    TuiCardLarge,
    TuiChip,
    TuiIcon,
    TuiList,
    TuiSurface,
  ],
  templateUrl: './booking-schedule-page.html',
  styleUrl: './booking-schedule-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingSchedulePage {
  private readonly router = inject(Router);

  protected readonly draft = inject(BookingDraftStore);
  protected readonly categoryName = spaceCategoryName;

  protected readonly icon = computed(() => {
    const space = this.draft.space();

    return space ? spaceCategoryIcon(space.category) : '';
  });

  protected readonly rules = computed(() => {
    const space = this.draft.space();

    return space ? spaceCategoryRules(space.category) : [];
  });

  protected readonly range = computed(() => {
    const booking = this.draft.booking();

    return booking ? formatBookingRange(booking.startMinutes, booking.endMinutes) : null;
  });

  protected continueToReview(): void {
    const booking = this.draft.booking();

    if (booking) {
      void this.router.navigate(['/book', booking.space.id, 'review']);
    }
  }
}
