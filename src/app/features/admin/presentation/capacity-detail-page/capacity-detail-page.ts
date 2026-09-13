import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiItem } from '@taiga-ui/cdk';
import { TuiButton, TuiLink } from '@taiga-ui/core';
import { TuiBreadcrumbs } from '@taiga-ui/kit';
import { APP_CONFIG } from '../../../../core/config/app-config';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { parseIsoDate, startOfDay, toIsoDate } from '../../../../shared/time/calendar-day';
import { countExpiringSoon, occupancyOf } from '../../domain/attendance-roster';
import {
  blockKeyOf,
  clampToNavigableRange,
  findBlockByKey,
  navigableDayRange,
} from '../../domain/block-schedule';
import { MOCK_SPACE_PROFILES, mockBlocksFor } from '../../infrastructure/mock-attendance';
import { AttendeeRoster } from '../attendee-roster/attendee-roster';
import { BlockSwitcher } from '../block-switcher/block-switcher';
import { MetricCard } from '../metric-card/metric-card';
import { OccupancyCard } from '../occupancy-card/occupancy-card';

/**
 * Visual mock: layout and component inventory are final, the data is not.
 *
 * One block of the schedule, which is `docs/booking-flow.md` §11's "ver el bloque actual" — except
 * that the current block turned out not to be a special case, only the row the list opens by
 * default. The `BlockSwitcher` stays for the sideways move between adjacent blocks: somebody
 * comparing 14:00 with 16:00 should not have to go back up and come down again.
 *
 * Space, day and block all travel in the address, so going back is dropping the last segment and
 * everything else survives. Everything is derived with `computed()` for the same reason the list
 * is: the router re-emits inputs on this instance when only the query changes.
 */
@Component({
  selector: 'app-capacity-detail-page',
  imports: [
    AttendeeRoster,
    BlockSwitcher,
    EmptyState,
    MetricCard,
    OccupancyCard,
    RouterLink,
    TuiBreadcrumbs,
    TuiButton,
    TuiItem,
    TuiLink,
  ],
  templateUrl: './capacity-detail-page.html',
  styleUrl: './capacity-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapacityDetailPage {
  /** The block's start within its day, as `HH-mm`. The day itself travels in `?date=`. */
  public readonly block = input<string | null>(null);
  public readonly space = input<string | null>(null);
  public readonly date = input<string | null>(null);
  /** Free text from the panel's bar, which searches the roster of whatever block is open. */
  public readonly query = input<string | null>(null);

  private readonly config = inject(APP_CONFIG);
  private readonly router = inject(Router);

  /**
   * Read once per render rather than on a timer: the panel is a screen somebody is standing in front
   * of, and a count that ticks while they read it is harder to trust than one that matches the list
   * underneath. The countdown belongs to the scanning view, not to this one.
   */
  protected readonly now = new Date();

  protected readonly selectedSpaceId = computed(() => {
    const requested = this.space();

    return MOCK_SPACE_PROFILES.some((candidate) => candidate.spaceId === requested) &&
      requested !== null
      ? requested
      : MOCK_SPACE_PROFILES[0].spaceId;
  });

  protected readonly selectedDay = computed(() =>
    clampToNavigableRange(
      parseIsoDate(this.date()) ?? startOfDay(this.now),
      navigableDayRange(
        this.now,
        this.config.capacityHistoryDays,
        this.config.capacityPlanningDays,
      ),
    ),
  );

  protected readonly dayParam = computed(() => toIsoDate(this.selectedDay()));

  protected readonly blocksForDay = computed(() =>
    mockBlocksFor(this.selectedSpaceId(), this.selectedDay(), this.now),
  );

  /** `undefined` rather than a fallback: a block that is not there is worth saying so about, and
   *  quietly opening a different hour would be a worse answer than an empty state. */
  protected readonly current = computed(() => findBlockByKey(this.blocksForDay(), this.block()));

  protected readonly occupancy = computed(() => {
    const block = this.current();

    return block ? occupancyOf(block) : null;
  });

  protected readonly expiringSoon = computed(() => {
    const block = this.current();

    return block ? countExpiringSoon(block, this.now) : 0;
  });

  /** No warning icon when there is nothing to warn about: "none" is good news, not an alert. */
  protected readonly expiryIcon = computed(() =>
    this.expiringSoon() > 0 ? '@tui.triangle-alert' : null,
  );

  protected readonly listParams = computed(() => ({
    space:
      this.selectedSpaceId() === MOCK_SPACE_PROFILES[0].spaceId ? null : this.selectedSpaceId(),
    date: this.dayParam() === toIsoDate(startOfDay(this.now)) ? null : this.dayParam(),
  }));

  /** The sideways move: same day, same space, a different hour, so only the last segment changes. */
  protected selectBlock(start: number): void {
    const target = this.blocksForDay().find((block) => block.start.getTime() === start);

    if (!target) {
      return;
    }

    void this.router.navigate(['/admin/blocks', blockKeyOf(target)], {
      queryParams: this.listParams(),
    });
  }
}
