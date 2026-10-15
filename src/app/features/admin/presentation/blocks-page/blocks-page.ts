import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, Scroll } from '@angular/router';
import { TuiButton, TuiLoader } from '@taiga-ui/core';
import { filter, firstValueFrom } from 'rxjs';
import { APP_CONFIG } from '../../../../core/config/app-config';
import {
  isSameDay,
  parseIsoDate,
  startOfDay,
  toIsoDate,
} from '../../../../shared/time/calendar-day';
import { AdminBlockRepository } from '../../domain/admin-block.repository';
import {
  clampToNavigableRange,
  daysOf,
  navigableDayRange,
  isDayOver,
  remainingDayOf,
  weekGridRange,
} from '../../domain/block-schedule';
import { BlockDaySchedule } from '../block-day-schedule/block-day-schedule';
import { BlockWeekGrid } from '../block-week-grid/block-week-grid';

/**
 * `docs/booking-flow.md` §11 asks the panel to let an administrator consult a day's blocks. Built
 * for desk staff who should not need training: two steps read top to bottom — pick a day (this week
 * or next), then read its blocks — and one number everywhere, free spots, with the same icon-and-word
 * status beside it. Picking a day scrolls to and focuses its heading, so the step lands visibly even
 * on a phone where the schedule starts out of sight.
 *
 * Which day is showing lives in the URL rather than in the component — a filtered day becomes a
 * link somebody can send, and the detail can return here without the shell having to remember
 * anything on its behalf. Which space is showing lives in the URL too, but as the panel's own
 * `:spaceId` segment rather than this view's concern: it arrives as an input the same way the day
 * does. Everything is therefore derived with `computed()` over the inputs — `withComponentInputBinding`
 * re-emits on the same instance when only the query changes, so a value captured once into a
 * `signal` would leave the page frozen on the day it first opened.
 */
@Component({
  selector: 'app-blocks-page',
  imports: [BlockDaySchedule, BlockWeekGrid, TuiButton, TuiLoader],
  templateUrl: './blocks-page.html',
  styleUrl: './blocks-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocksPage {
  public readonly spaceId = input.required<string>();
  /** Bound from `?date=` by the router. Absent means "today", not "invalid". */
  public readonly date = input<string | null>(null);

  private readonly config = inject(APP_CONFIG);
  private readonly repository = inject(AdminBlockRepository);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);

  /**
   * Read once per render rather than on a timer: the panel is a screen somebody is standing in front
   * of, and a list that reshuffles itself while they read it is harder to trust than one that
   * matches what they were told. It is passed down instead of read again per row so the whole list
   * agrees on one instant.
   */
  protected readonly now = new Date();

  protected readonly range = computed(() =>
    navigableDayRange(this.now, this.config.capacityHistoryDays, this.config.capacityPlanningDays),
  );

  /** A date that is missing, unreadable or out of range lands on the nearest day the panel can
   *  show. Refusing to render would punish a typo with a dead end. */
  protected readonly selectedDay = computed(() =>
    clampToNavigableRange(parseIsoDate(this.date()) ?? startOfDay(this.now), this.range()),
  );

  protected readonly dayParam = computed(() => toIsoDate(this.selectedDay()));

  protected readonly viewingToday = computed(() => isSameDay(this.selectedDay(), this.now));

  private readonly daySchedule = viewChild.required(BlockDaySchedule);

  /**
   * Today's blocks are always fetched: the week picker needs them to show today as it can still be
   * booked rather than as the server's whole-day total (see `remainingDayOf`). When today is the day
   * selected they double as the schedule, so the selected-day request is skipped instead of repeated.
   */
  private readonly todaySchedule = rxResource({
    params: () => ({ spaceId: this.spaceId() }),
    stream: ({ params }) => this.repository.blocksOf(params.spaceId, startOfDay(this.now)),
    defaultValue: [],
  });

  /**
   * Keyed on the day the view settled on rather than on the parameter it arrived as: a date that
   * was out of range is clamped, and asking the server for the unclamped one would fetch a day the
   * list is not going to show.
   */
  private readonly otherDaySchedule = rxResource({
    params: () =>
      this.viewingToday()
        ? undefined
        : { spaceId: this.spaceId(), day: this.selectedDay().getTime() },
    stream: ({ params }) => this.repository.blocksOf(params.spaceId, new Date(params.day)),
    defaultValue: [],
  });

  protected readonly schedule = computed(() =>
    this.viewingToday() ? this.todaySchedule : this.otherDaySchedule,
  );

  protected readonly dayRemaining = computed(() =>
    remainingDayOf(this.selectedDay(), this.schedule().value(), this.now),
  );

  protected readonly weekRange = computed(() => weekGridRange(this.now));

  protected readonly weekDays = computed(() => daysOf(this.weekRange()));

  protected readonly summary = rxResource({
    params: () => ({ spaceId: this.spaceId(), range: this.weekRange() }),
    stream: ({ params }) => this.repository.summaryOf(params.spaceId, params.range),
    defaultValue: [],
  });

  /** Today once its last block has ended: the week reads it "Finalizado" like any earlier day. */
  protected readonly todayOver = computed(() => isDayOver(this.todaySchedule.value(), this.now));

  // A finished today keeps the server's summary, so it reads as a day that opened, not a closed one.
  protected readonly daySummaries = computed(() => {
    const today = remainingDayOf(startOfDay(this.now), this.todaySchedule.value(), this.now);

    return this.summary
      .value()
      .map((summary) => (isSameDay(summary.date, this.now) && !this.todayOver() ? today : summary));
  });

  protected readonly weekLoading = computed(
    () => this.summary.isLoading() || this.todaySchedule.isLoading(),
  );

  protected readonly exporting = signal(false);

  /** Failures need no handling here: the interceptor already tells the user. */
  protected exportReport(): void {
    if (this.exporting()) {
      return;
    }

    this.exporting.set(true);
    this.repository.exportBlocks(this.spaceId(), this.selectedDay()).subscribe({
      next: (report) => {
        this.save(report.fileName, report.content);
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }

  private save(fileName: string, content: Blob): void {
    const url = URL.createObjectURL(content);
    const link = this.document.createElement('a');

    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected selectDay(day: Date): void {
    void this.showDay(day);
  }

  protected backToToday(): void {
    this.selectDay(this.now);
  }

  /**
   * The default is written as `null` so it leaves the address entirely: `?date=` naming today says a
   * day was chosen when none was, the same call `AdminHeader` makes about an empty search.
   *
   * The reveal waits for the router's own `Scroll` event: with `scrollPositionRestoration` enabled
   * the router scrolls to the top after every navigation, query-only ones included, and would undo
   * a reveal made any earlier. That event is emitted a frame after the navigation settles, so
   * subscribing once `navigate` resolves is still in time. A navigation that did not happen (the day
   * already showing) emits nothing to wait for.
   */
  private async showDay(day: Date): Promise<void> {
    const iso = toIsoDate(day);
    const navigated = await this.router.navigate([], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
      queryParams: { date: iso === toIsoDate(startOfDay(this.now)) ? null : iso },
    });

    if (navigated) {
      await firstValueFrom(this.router.events.pipe(filter((event) => event instanceof Scroll)));
    }

    this.daySchedule().reveal();
  }
}
