import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiAppearance, TuiButton, TuiIcon, TuiLink, TuiLoader } from '@taiga-ui/core';
import { TuiCardLarge, TuiList, TuiSurface } from '@taiga-ui/layout';
import { createAppError, isAppError } from '../../../../core/errors/app-error';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { MediaPlate } from '../../../../shared/media-plate/media-plate';
import { formatTimeRange } from '../../../../shared/time/time-of-day';
import { spaceCategoryIcon, spaceCategoryRules } from '../../../spaces/presentation/space-category';
import { BookingDraftStore } from '../../application/booking-draft.store';

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
    TuiLoader,
    TuiSurface,
  ],
  templateUrl: './booking-review-page.html',
  styleUrl: './booking-review-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingReviewPage {
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly draft = inject(BookingDraftStore);

  protected readonly booking = this.draft.booking;

  /** The button stays put while the request is in flight, so the booking cannot be sent twice. */
  protected readonly creating = signal(false);

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

    return booking ? formatTimeRange(booking.startMinutes, booking.endMinutes) : '';
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
    if (this.creating()) {
      return;
    }

    this.creating.set(true);

    this.draft.confirm().subscribe({
      next: () => void this.router.navigate(['/book', 'done'], { replaceUrl: true }),
      error: (error: unknown) => {
        this.creating.set(false);
        this.report(error);
      },
    });
  }

  /**
   * A block that stopped being bookable while the student was reading this page is not a technical
   * failure, and telling them to reload would be the wrong advice: what is left to do is pick
   * another one, so the message says so and the flow steps back to the grid, which reads the day
   * again on the way in. Which of the refusals it was — full, too late, or one booking here
   * already — the server does not distinguish, so neither does the wording.
   */
  private report(error: unknown): void {
    const booking = this.booking();
    const code = isAppError(error) ? error.code : 'unknown';

    if (!booking || (code !== 'conflict' && code !== 'validation')) {
      this.notifications.error(isAppError(error) ? error : createAppError('unknown'));

      return;
    }

    this.notifications.warn(
      $localize`:@@booking.review.taken.summary:Ese bloque ya no está disponible`,
      $localize`:@@booking.review.taken.detail:Puede que se haya llenado o que ya no dé tiempo. Elige otro bloque para continuar.`,
    );

    void this.router.navigate(['/book', booking.space.id, 'when']);
  }
}
