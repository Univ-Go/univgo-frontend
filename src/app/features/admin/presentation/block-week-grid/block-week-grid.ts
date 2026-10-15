import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { TuiBadge, TuiSegmented } from '@taiga-ui/kit';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { isSameDay, startOfDay, toIsoDate } from '../../../../shared/time/calendar-day';
import type { SpaceDaySummary } from '../../domain/block-schedule';
import { BlockStatusBadge } from '../block-status-badge/block-status-badge';
import { BlockWeekDay } from '../block-week-day/block-week-day';

const DAYS_PER_WEEK = 7;

/**
 * Level 3: the day picker. The current week and the next one sit behind two tabs rather than one
 * open and one collapsed, so neither is hidden behind a control whose label has to be learned, and
 * the picker keeps one height whichever week is showing.
 *
 * The tab follows the selected day — a link to a day next week opens on that week — but switching
 * tabs does not change the day: looking ahead is not the same as choosing.
 *
 * `days` and `summaries` arrive separately because the fourteen dates are known before the request
 * that answers how full each one is resolves; the grid draws its shape at once and only the load
 * waits on the network.
 */
@Component({
  selector: 'app-block-week-grid',
  imports: [
    BlockStatusBadge,
    BlockWeekDay,
    DatePipe,
    EmptyState,
    TuiBadge,
    TuiButton,
    TuiSegmented,
  ],
  templateUrl: './block-week-grid.html',
  styleUrl: './block-week-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockWeekGrid {
  public readonly days = input.required<readonly Date[]>();
  public readonly summaries = input.required<readonly SpaceDaySummary[]>();
  /** Passed in so "today" cannot drift from whatever the rest of the page treats as now. */
  public readonly now = input.required<Date>();
  /** Today has run through its blocks, so it reads as finished rather than as still bookable. */
  public readonly todayOver = input(false);
  public readonly selectedDay = input.required<Date>();
  public readonly loading = input(false);
  public readonly error = input<unknown>(null);

  public readonly daySelected = output<Date>();
  public readonly retry = output<void>();

  protected readonly weeks = computed(() => {
    const days = this.days();

    return [days.slice(0, DAYS_PER_WEEK), days.slice(DAYS_PER_WEEK)].filter(
      (week) => week.length === DAYS_PER_WEEK,
    );
  });

  protected readonly weekIndex = linkedSignal(() => {
    const index = this.weeks().findIndex((week) =>
      week.some((day) => isSameDay(day, this.selectedDay())),
    );

    return Math.max(index, 0);
  });

  protected readonly visibleWeek = computed(() => this.weeks()[this.weekIndex()] ?? []);

  private readonly summaryByIsoDate = computed(() => {
    const index = new Map<string, SpaceDaySummary>();

    for (const summary of this.summaries()) {
      index.set(toIsoDate(summary.date), summary);
    }

    return index;
  });

  protected isToday(day: Date): boolean {
    return isSameDay(day, this.now());
  }

  protected isPast(day: Date): boolean {
    return (
      day.getTime() < startOfDay(this.now()).getTime() || (this.todayOver() && this.isToday(day))
    );
  }

  protected isSelected(day: Date): boolean {
    return isSameDay(day, this.selectedDay());
  }

  protected summaryOf(day: Date): SpaceDaySummary | null {
    return this.summaryByIsoDate().get(toIsoDate(day)) ?? null;
  }
}
