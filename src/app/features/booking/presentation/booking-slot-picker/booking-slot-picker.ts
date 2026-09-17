import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiTitle } from '@taiga-ui/core';
import { TuiBlock, TuiSkeleton } from '@taiga-ui/kit';
import { formatTimeOfDay } from '../../../../shared/time/time-of-day';
import type { Space } from '../../../spaces/domain/space';
import type { BlockBlocker, SpaceBlock } from '../../../spaces/domain/space-block';
import { SpaceRepository } from '../../../spaces/domain/space.repository';

/** A booking window a person can plan around without the picker turning into a calendar. */
const DAYS_OFFERED = 7;

/** Placeholder blocks drawn while the day's availability loads. */
const SKELETON_BLOCKS = Array.from({ length: 6 }, (_, index) => index);

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
}

interface OfferedBlock {
  readonly block: SpaceBlock;
  readonly minutes: number;
  readonly available: boolean;
  readonly free: number;
  readonly blocker: BlockBlocker | null;
  readonly label: string;
  readonly end: string;
}

/**
 * Level 3: the "when" of the booking, as the two questions it actually is — which day, then which
 * block of that day. A day strip and a grid of blocks beat a date field and a time field on a
 * phone: everything on offer is visible and one tap away, and a block that cannot be taken is shown
 * with the reason instead of quietly missing from a dropdown.
 *
 * The day's blocks are read from the server rather than derived here, because what makes a block
 * available is not opening hours: it is how many plazas are left, what else this student has
 * booked, and how much of the block remains. Only the server knows the first two, and only its
 * clock can be trusted for the third (`docs/booking-flow.md` §13).
 *
 * Which is also why no day in the strip claims to have room: that answer costs one request per day
 * and would go stale immediately. A day is a question the student asks, and the grid answers it.
 *
 * Built from `label[tuiBlock]` around native radios rather than from a bespoke button group: one
 * choice out of many is what a radio group is, so keyboard support, grouping and the announced
 * "3 of 7" come from the platform, and Taiga's block appearance draws the selected and disabled
 * states from the same tokens as the rest of the product.
 */
@Component({
  selector: 'app-booking-slot-picker',
  imports: [DatePipe, FormsModule, TuiBlock, TuiButton, TuiSkeleton, TuiTitle],
  templateUrl: './booking-slot-picker.html',
  styleUrl: './booking-slot-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingSlotPicker {
  public readonly space = input.required<Space>();
  public readonly date = input.required<Date>();
  public readonly block = input.required<SpaceBlock | null>();

  public readonly dateSelected = output<Date>();
  public readonly blockSelected = output<SpaceBlock>();

  private readonly spaces = inject(SpaceRepository);

  protected readonly selectedDay = computed(() => this.date().getTime());

  /** Read once: the strip must not slide forward every time the user picks a day further out. */
  private readonly firstDay = startOfToday();

  protected readonly days = computed<readonly OfferedDay[]>(() =>
    Array.from({ length: DAYS_OFFERED }, (_, offset) => {
      const date = addDays(this.firstDay, offset);

      return { date, time: date.getTime() };
    }),
  );

  protected readonly availability = rxResource({
    params: () => ({ spaceId: this.space().id, day: this.selectedDay() }),
    stream: ({ params }) => this.spaces.availability(params.spaceId, new Date(params.day)),
    defaultValue: [],
  });

  protected readonly skeletonBlocks = SKELETON_BLOCKS;

  protected readonly selectedStart = computed(() => this.block()?.startMinutes ?? null);

  protected readonly blocks = computed<readonly OfferedBlock[]>(() =>
    this.availability.value().map((block) => ({
      block,
      minutes: block.startMinutes,
      available: block.blocker === null,
      free: block.free,
      blocker: block.blocker,
      label: formatTimeOfDay(block.startMinutes),
      end: formatTimeOfDay(block.endMinutes),
    })),
  );

  protected pickDay(time: number): void {
    this.dateSelected.emit(new Date(time));
  }

  /**
   * The whole block travels on, not just its hour: the check-in window the server computed for it
   * is what step three has to warn about, and looking it up again later would mean asking the
   * server a second time for an answer already in hand.
   */
  protected pickBlock(offered: OfferedBlock): void {
    this.blockSelected.emit(offered.block);
  }
}
