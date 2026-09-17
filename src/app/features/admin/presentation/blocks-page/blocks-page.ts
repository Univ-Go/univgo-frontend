import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import type { Params } from '@angular/router';
import { APP_CONFIG } from '../../../../core/config/app-config';
import { parseIsoDate, startOfDay, toIsoDate } from '../../../../shared/time/calendar-day';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { clampToNavigableRange, navigableDayRange } from '../../domain/block-schedule';
import { AdminSpacesStore } from '../../application/admin-spaces.store';
import { mockBlocksFor } from '../../infrastructure/mock-attendance';
import { BlockDayStepper } from '../block-day-stepper/block-day-stepper';
import { BlockRow } from '../block-row/block-row';

/**
 * Visual mock: layout and component inventory are final, the data is not. `mock-attendance` is the
 * panel's only hardcoded source, and every number on screen is derived from its block by the domain
 * rather than written beside it. It moves behind a port once the check-in API exists.
 *
 * `docs/booking-flow.md` §11 asks the panel to let an administrator consult a day's blocks. This is
 * that day, as a list: which space, which day, and then each block saying only what the clock lets
 * it say about itself. The block in progress is not a separate view — it is one row of this list,
 * marked as current.
 *
 * Which day is showing lives in the URL rather than in the component — a filtered day becomes a link
 * somebody can send, and the detail can return here without the shell having to remember anything on
 * its behalf. Which space is showing lives in the URL too, but as the panel's own `:spaceId` segment
 * rather than this view's concern: it arrives as an input the same way the day does. Everything is
 * therefore derived with `computed()` over the inputs — `withComponentInputBinding` re-emits on the
 * same instance when only the query changes, so a value captured once into a `signal` would leave
 * the page frozen on the day it first opened.
 */
@Component({
  selector: 'app-blocks-page',
  imports: [BlockDayStepper, BlockRow, DatePipe, EmptyState],
  templateUrl: './blocks-page.html',
  styleUrl: './blocks-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocksPage {
  public readonly spaceId = input.required<string>();
  /** Bound from `?date=` by the router. Absent means "today", not "invalid". */
  public readonly date = input<string | null>(null);

  private readonly config = inject(APP_CONFIG);
  private readonly spaces = inject(AdminSpacesStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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

  /**
   * The space is the catalogue's, so its name, id and capacity are real; who is inside it is what
   * `mock-attendance` still fabricates. Reading it through the store costs no request of its own:
   * the guard on `:spaceId` already filled that cache on the way in.
   */
  private readonly space = rxResource({
    params: () => this.spaceId(),
    stream: ({ params }) => this.spaces.find(params),
    defaultValue: null,
  });

  protected readonly blocks = computed(() => {
    const space = this.space.value();

    return space ? mockBlocksFor(space, this.selectedDay(), this.now) : [];
  });

  protected selectDay(day: Date): void {
    const iso = toIsoDate(day);

    this.navigate({ date: iso === toIsoDate(startOfDay(this.now)) ? null : iso });
  }

  /**
   * The default is written as `null` so it leaves the address entirely: `?date=` naming today says a
   * day was chosen when none was, the same call `AdminHeader` makes about an empty search.
   */
  private navigate(params: Params): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
      queryParams: params,
    });
  }
}
