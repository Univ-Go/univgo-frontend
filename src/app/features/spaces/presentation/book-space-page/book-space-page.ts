import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TuiDay, TuiItem, TuiTime } from '@taiga-ui/cdk';
import { TuiAppearance, TuiButton, TuiDataList, TuiIcon, TuiLink } from '@taiga-ui/core';
import { TuiBreadcrumbs, TuiInputDate, TuiInputTime } from '@taiga-ui/kit';
import { TuiCardLarge, TuiList, TuiSurface } from '@taiga-ui/layout';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { availableStartMinutes } from '../../domain/space-catalog';
import { MOCK_SPACES } from '../../infrastructure/mock-spaces';
import { spaceCategoryIcon, spaceCategoryRules } from '../space-category';

const MINUTES_PER_HOUR = 60;

/** A booking is one campus slot, not a custom span the user negotiates by hand. */
const BOOKING_DURATION_MINUTES = 60;

/** Matches the granularity `SpacesPage` already searches at. */
const START_TIME_STEP_MINUTES = 30;

function toTime(minutes: number): TuiTime {
  return new TuiTime(Math.floor(minutes / MINUTES_PER_HOUR), minutes % MINUTES_PER_HOUR);
}

function toMinutes(time: TuiTime): number {
  return time.hours * MINUTES_PER_HOUR + time.minutes;
}

/**
 * Visual mock, reading from the same `MOCK_SPACES` source the catalogue does. It moves behind a
 * booking use case once the reservations API exists — confirming here only simulates the outcome
 * (a success toast and a trip to the reservations list), it does not write a new reservation
 * anywhere the list view could read it back from.
 *
 * `id` is bound from the `:id` route param via `withComponentInputBinding()`. A missing/unknown id
 * is a real, reachable state (stale link, typed URL) and gets its own empty state.
 *
 * The booking is always one hour, at the same 30-minute granularity the catalogue's own search
 * uses, so picking a date never needs a duration control of its own — only a start time.
 */
@Component({
  selector: 'app-book-space-page',
  imports: [
    DatePipe,
    EmptyState,
    FormsModule,
    RouterLink,
    TuiAppearance,
    TuiBreadcrumbs,
    TuiButton,
    TuiCardLarge,
    TuiDataList,
    TuiIcon,
    TuiInputDate,
    TuiInputTime,
    TuiItem,
    TuiLink,
    TuiList,
    TuiSurface,
  ],
  templateUrl: './book-space-page.html',
  styleUrl: './book-space-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookSpacePage {
  public readonly id = input<string>();

  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  protected readonly space = computed(() =>
    MOCK_SPACES.find((candidate) => candidate.id === this.id()),
  );

  protected readonly icon = computed(() => {
    const space = this.space();

    return space ? spaceCategoryIcon(space.category) : null;
  });

  protected readonly rules = computed(() => {
    const space = this.space();

    return space ? spaceCategoryRules(space.category) : [];
  });

  /** Read once: a page open past midnight should not silently change what "today" means. */
  protected readonly today = TuiDay.currentLocal();

  protected readonly date = linkedSignal(() => this.today);

  /** A date change answers a different question, so a start time chosen for the old one is dropped. */
  protected readonly startTime = linkedSignal<TuiDay, TuiTime | null>({
    source: this.date,
    computation: () => null,
  });

  protected readonly startOptions = computed(() => {
    const space = this.space();

    if (!space) {
      return [];
    }

    return availableStartMinutes(
      space,
      this.date().toLocalNativeDate(),
      BOOKING_DURATION_MINUTES,
      START_TIME_STEP_MINUTES,
    ).map(toTime);
  });

  protected readonly hasAvailability = computed(() => this.startOptions().length > 0);

  protected readonly endTime = computed(() => {
    const start = this.startTime();

    return start ? toTime(toMinutes(start) + BOOKING_DURATION_MINUTES) : null;
  });

  protected setDate(day: TuiDay | null): void {
    this.date.set(day ?? this.today);
  }

  protected confirm(): void {
    const space = this.space();

    if (!space || !this.startTime()) {
      return;
    }

    this.notifications.success(
      $localize`:@@spaces.book.confirmedTitle:Reserva confirmada`,
      $localize`:@@spaces.book.confirmedDetail:La puedes consultar en Mis reservas.`,
    );

    void this.router.navigateByUrl('/reservations');
  }
}
