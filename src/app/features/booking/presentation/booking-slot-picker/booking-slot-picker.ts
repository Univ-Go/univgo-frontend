import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiTitle } from '@taiga-ui/core';
import { TuiBlock } from '@taiga-ui/kit';
import type { Space } from '../../../spaces/domain/space';
import { listStartOptions } from '../../../spaces/domain/space-catalog';
import { BOOKING_DURATION_MINUTES, BOOKING_START_STEP_MINUTES } from '../../domain/booking-draft';
import { formatBookingTime } from '../booking-time';

/** A booking window a person can plan around without the picker turning into a calendar. */
const DAYS_OFFERED = 7;

function startOfToday(): number {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date.getTime();
}

/** Calendar arithmetic, not milliseconds: a fixed day of milliseconds skips an hour across DST. */
function addDays(time: number, days: number): Date {
  const date = new Date(time);

  date.setDate(date.getDate() + days);

  return date;
}

interface OfferedDay {
  readonly date: Date;
  readonly time: number;
  readonly available: boolean;
}

interface OfferedHour {
  readonly minutes: number;
  readonly available: boolean;
  readonly label: string;
  readonly end: string;
}

/**
 * Level 3: the "when" of the booking, as the two questions it actually is — which day, then which
 * hour of that day. A day strip and a grid of hour blocks beat a date field and a time field on a
 * phone: everything on offer is visible and one tap away, and an hour that is already taken can be
 * shown as taken instead of quietly missing from a dropdown.
 *
 * Built from `label[tuiBlock]` around native radios rather than from a bespoke button group: one
 * choice out of many is what a radio group is, so keyboard support, grouping and the announced
 * "3 of 7" come from the platform, and Taiga's block appearance draws the selected and disabled
 * states from the same tokens as the rest of the product.
 */
@Component({
  selector: 'app-booking-slot-picker',
  imports: [DatePipe, FormsModule, TuiBlock, TuiTitle],
  templateUrl: './booking-slot-picker.html',
  styleUrl: './booking-slot-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingSlotPicker {
  public readonly space = input.required<Space>();
  public readonly date = input.required<Date>();
  public readonly startMinutes = input.required<number | null>();

  public readonly dateSelected = output<Date>();
  public readonly startSelected = output<number>();

  protected readonly selectedDay = computed(() => this.date().getTime());

  /** Read once: the strip must not slide forward every time the user picks a day further out. */
  private readonly firstDay = startOfToday();

  protected readonly days = computed<readonly OfferedDay[]>(() =>
    Array.from({ length: DAYS_OFFERED }, (_, offset) => {
      const date = addDays(this.firstDay, offset);

      return {
        date,
        time: date.getTime(),
        available: this.hasHours(date),
      };
    }),
  );

  protected readonly hours = computed<readonly OfferedHour[]>(() =>
    listStartOptions(
      this.space(),
      this.date(),
      BOOKING_DURATION_MINUTES,
      BOOKING_START_STEP_MINUTES,
    ).map((option) => ({
      minutes: option.minutes,
      available: option.available,
      label: formatBookingTime(option.minutes),
      end: formatBookingTime(option.minutes + BOOKING_DURATION_MINUTES),
    })),
  );

  protected pickDay(time: number): void {
    this.dateSelected.emit(new Date(time));
  }

  private hasHours(date: Date): boolean {
    return listStartOptions(
      this.space(),
      date,
      BOOKING_DURATION_MINUTES,
      BOOKING_START_STEP_MINUTES,
    ).some((option) => option.available);
  }
}
