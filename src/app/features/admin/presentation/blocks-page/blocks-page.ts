import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TUI_BREAKPOINT } from '@taiga-ui/core';
import type { Params } from '@angular/router';
import { APP_CONFIG } from '../../../../core/config/app-config';
import { parseIsoDate, startOfDay, toIsoDate } from '../../../../shared/time/calendar-day';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { clampToNavigableRange, navigableDayRange } from '../../domain/block-schedule';
import { MOCK_SPACE_PROFILES, mockBlocksFor } from '../../infrastructure/mock-attendance';
import { BlockDayStepper } from '../block-day-stepper/block-day-stepper';
import { BlockRow } from '../block-row/block-row';
import { SpaceSwitcher } from '../space-switcher/space-switcher';

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
 * Which space and which day live in the URL rather than in the component. Two reasons, and the
 * second is the one that matters: a filtered day becomes a link somebody can send, and the detail
 * can return here without the shell having to remember anything on its behalf. Everything is
 * therefore derived with `computed()` over the inputs — `withComponentInputBinding` re-emits on the
 * same instance when only the query changes, so a value captured once into a `signal` would leave
 * the page frozen on the day it first opened.
 */
@Component({
  selector: 'app-blocks-page',
  imports: [BlockDayStepper, BlockRow, DatePipe, EmptyState, SpaceSwitcher],
  templateUrl: './blocks-page.html',
  styleUrl: './blocks-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocksPage {
  /** Bound from `?space=` and `?date=` by the router. Absent means "the defaults", not "invalid". */
  public readonly space = input<string | null>(null);
  public readonly date = input<string | null>(null);

  private readonly config = inject(APP_CONFIG);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly breakpoint = inject(TUI_BREAKPOINT);

  /**
   * Read once per render rather than on a timer: the panel is a screen somebody is standing in front
   * of, and a list that reshuffles itself while they read it is harder to trust than one that
   * matches what they were told. It is passed down instead of read again per row so the whole list
   * agrees on one instant.
   */
  protected readonly now = new Date();

  protected readonly spaces = MOCK_SPACE_PROFILES;

  /** The switcher takes the whole row on a phone, where a pill against the edge is both a small
   *  target and the second most-used control on the page. Same reading `AttendeeRoster` makes. */
  protected readonly compact = computed(() => this.breakpoint() === 'mobile');

  protected readonly range = computed(() =>
    navigableDayRange(this.now, this.config.capacityHistoryDays, this.config.capacityPlanningDays),
  );

  /** An unknown space falls back rather than emptying the view: a stale link should still open the
   *  panel on something real. */
  protected readonly selectedSpaceId = computed(() => {
    const requested = this.space();

    return this.spaces.some((candidate) => candidate.spaceId === requested) && requested !== null
      ? requested
      : this.spaces[0].spaceId;
  });

  /** A date that is missing, unreadable or out of range lands on the nearest day the panel can
   *  show. Refusing to render would punish a typo with a dead end. */
  protected readonly selectedDay = computed(() =>
    clampToNavigableRange(parseIsoDate(this.date()) ?? startOfDay(this.now), this.range()),
  );

  protected readonly dayParam = computed(() => toIsoDate(this.selectedDay()));

  protected readonly blocks = computed(() =>
    mockBlocksFor(this.selectedSpaceId(), this.selectedDay(), this.now),
  );

  protected selectSpace(spaceId: string): void {
    this.navigate({ space: spaceId === this.spaces[0].spaceId ? null : spaceId });
  }

  protected selectDay(day: Date): void {
    const iso = toIsoDate(day);

    this.navigate({ date: iso === toIsoDate(startOfDay(this.now)) ? null : iso });
  }

  /**
   * Merged so one control does not clear the other's choice, and the defaults are written as `null`
   * so they leave the address entirely: `?date=` naming today says a day was chosen when none was,
   * the same call `AdminHeader` makes about an empty search.
   */
  private navigate(params: Params): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
      queryParams: params,
    });
  }
}
