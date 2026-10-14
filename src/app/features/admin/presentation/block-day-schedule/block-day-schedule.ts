import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiSkeleton } from '@taiga-ui/kit';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import type { AdminBlock } from '../../domain/attendance';
import { groupBlocksByShift, type BlockShift } from '../../domain/block-schedule';
import { BLOCK_SHIFT_ICONS, BLOCK_SHIFT_LABELS } from '../block-shift-copy';
import { BlockRow } from '../block-row/block-row';

/** Placeholder rows drawn while the day loads: a screenful, not the whole schedule. */
const SKELETON_ROWS = Array.from({ length: 4 }, (_, index) => index);

/**
 * Level 2: one day's blocks, grouped into the three shifts the desk already thinks in —
 * `docs/booking-flow.md` §11 only asks for the list, the grouping is this view's own reading of it.
 * Used from both ways of picking a day — the stepper and the week grid — so the shift breakdown
 * follows whichever one the administrator is using instead of being a feature of just one of them.
 */
@Component({
  selector: 'app-block-day-schedule',
  imports: [BlockRow, DatePipe, EmptyState, TuiButton, TuiIcon, TuiSkeleton],
  templateUrl: './block-day-schedule.html',
  styleUrl: './block-day-schedule.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockDaySchedule {
  public readonly blocks = input.required<readonly AdminBlock[]>();
  /** Passed in rather than read here, so the whole page agrees on one instant. */
  public readonly now = input.required<Date>();
  /** The day the blocks belong to, as the stepper and the week grid already carry it — displayed
   *  and also handed to each row for its detail link. */
  public readonly day = input.required<string>();
  public readonly loading = input(false);
  public readonly error = input<unknown>(null);

  public readonly retry = output<void>();

  protected readonly skeletonRows = SKELETON_ROWS;

  protected readonly shiftGroups = computed(() => groupBlocksByShift(this.blocks()));

  protected shiftLabel(shift: BlockShift): string {
    return BLOCK_SHIFT_LABELS[shift];
  }

  protected shiftIcon(shift: BlockShift): string {
    return BLOCK_SHIFT_ICONS[shift];
  }
}
