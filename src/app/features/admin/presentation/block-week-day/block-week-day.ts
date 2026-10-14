import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TuiBadge, TuiSkeleton } from '@taiga-ui/kit';
import type { BlockLoad } from '../../domain/attendance';
import {
  fullnessBandOf,
  isDayOpen,
  type FullnessBand,
  type SpaceDaySummary,
} from '../../domain/block-schedule';

const PERCENT = 100;

type BadgeAppearance = 'neutral' | 'warning' | 'negative';

/**
 * A day blends in until its load says otherwise: only a band past "available" earns a colour, the
 * same way the desk would only mention a day's load unprompted once it is worth a warning. A single
 * block's own badge (`BlockStatusBadge`) always speaks, because it is the direct answer to "can I
 * book this one"; a day is one click away from that answer, not it.
 */
const BADGE_APPEARANCE: Readonly<Record<FullnessBand, BadgeAppearance>> = {
  available: 'neutral',
  nearlyFull: 'warning',
  full: 'negative',
};

/**
 * Level 3: one cell of the week grid — a day standing in for its whole schedule as one occupancy
 * percentage. `summary` is `null` while the week's totals are still loading, which is also what the
 * skeleton reads to decide what to draw instead.
 *
 * Today is not just another cell with a ring around it: its card carries the same live-occupancy
 * framing the block list below answers with, instead of the seats-left framing every other day uses,
 * because that is the question somebody looking at today is actually asking.
 *
 * The filled, brand-coloured surface belongs to whichever day is `viewing` — the one the schedule
 * below is actually showing — not to `today` on its own. The two usually coincide, but once they
 * don't, the "Hoy" badge switches from the white overlay built for that red background to an
 * ordinary `tuiBadge`, so a today that isn't selected never reads as painted.
 */
@Component({
  selector: 'app-block-week-day',
  imports: [DatePipe, TuiBadge, TuiSkeleton],
  templateUrl: './block-week-day.html',
  styleUrl: './block-week-day.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockWeekDay {
  public readonly day = input.required<Date>();
  public readonly summary = input<SpaceDaySummary | null>(null);
  public readonly today = input(false);
  /** Whether this is the day the schedule below is currently showing — distinct from `today`, which
   *  never moves once the day has started. This is what paints the card. */
  public readonly viewing = input(false);
  public readonly loading = input(false);

  public readonly selected = output<void>();

  protected readonly open = computed(() => {
    const summary = this.summary();

    return summary !== null && isDayOpen(summary);
  });

  protected readonly freeSpots = computed(() => this.summary()?.totalFree ?? 0);

  private readonly load = computed<BlockLoad>(() => {
    const capacity = this.summary()?.totalCapacity ?? 0;
    const free = this.summary()?.totalFree ?? 0;
    const occupied = capacity - free;

    return { capacity, occupied, free, ratio: capacity > 0 ? occupied / capacity : 0 };
  });

  protected readonly occupancyPercent = computed(() => Math.round(this.load().ratio * PERCENT));

  protected readonly badgeAppearance = computed(
    (): BadgeAppearance => BADGE_APPEARANCE[fullnessBandOf(this.load())],
  );
}
