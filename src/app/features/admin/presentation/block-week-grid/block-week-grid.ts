import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TuiButton, TuiExpand, TuiIcon } from '@taiga-ui/core';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { isSameDay, toIsoDate } from '../../../../shared/time/calendar-day';
import type { SpaceDaySummary } from '../../domain/block-schedule';
import { BlockWeekDay } from '../block-week-day/block-week-day';

const DAYS_PER_WEEK = 7;

/**
 * Level 3: the current week and the next one, each day standing in for its whole schedule as one
 * occupancy percentage. Which block that total breaks down into is a question for the day view, one
 * click away; this grid only answers "which day".
 *
 * The current week is always open; the next one starts collapsed behind "Desplegar" — a desk
 * checking today's load has no reason to scroll past a second week it did not ask for, but the
 * schedule two weeks out is still one tap away rather than a separate screen.
 *
 * `days` and `summaries` arrive separately because they come from different places at different
 * times: the fourteen dates are known the instant the range is, before the request that answers how
 * full each of them is resolves. Keeping them apart lets the grid draw its shape — every weekday and
 * date label — the moment the week changes, with only the badges waiting on the network.
 */
@Component({
  selector: 'app-block-week-grid',
  imports: [BlockWeekDay, DatePipe, EmptyState, TuiButton, TuiExpand, TuiIcon],
  templateUrl: './block-week-grid.html',
  styleUrl: './block-week-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockWeekGrid {
  public readonly days = input.required<readonly Date[]>();
  public readonly summaries = input.required<readonly SpaceDaySummary[]>();
  /** The instant "today" is measured against, passed in so the highlighted cell cannot drift from
   *  whatever the rest of the page is treating as now. */
  public readonly now = input.required<Date>();
  /** The day the schedule below is currently showing, independent of `now` — this is what paints a
   *  cell, so clicking a different day moves the highlight instead of leaving it stuck on today. */
  public readonly selectedDay = input.required<Date>();
  public readonly loading = input(false);
  public readonly error = input<unknown>(null);

  public readonly daySelected = output<Date>();
  public readonly retry = output<void>();

  protected readonly daysPerWeek = DAYS_PER_WEEK;

  protected readonly nextWeekOpen = signal(false);

  protected readonly thisWeek = computed(() => this.days().slice(0, DAYS_PER_WEEK));
  protected readonly nextWeek = computed(() => this.days().slice(DAYS_PER_WEEK));

  /** Keyed by the same ISO string a day cell renders with, so a summary answers for exactly the
   *  calendar day it was asked about, not for whatever instant its own `Date` happens to hold. */
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

  protected isSelected(day: Date): boolean {
    return isSameDay(day, this.selectedDay());
  }

  protected summaryOf(day: Date): SpaceDaySummary | null {
    return this.summaryByIsoDate().get(toIsoDate(day)) ?? null;
  }

  protected toggleNextWeek(): void {
    this.nextWeekOpen.update((open) => !open);
  }
}
