import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TuiItem } from '@taiga-ui/cdk';
import { TuiButton, TuiLink } from '@taiga-ui/core';
import { TuiBreadcrumbs, TuiSkeleton } from '@taiga-ui/kit';
import { APP_CONFIG } from '../../../../core/config/app-config';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { parseIsoDate, startOfDay, toIsoDate } from '../../../../shared/time/calendar-day';
import { AdminSpacesStore } from '../../application/admin-spaces.store';
import { AdminBlockRepository } from '../../domain/admin-block.repository';
import { blockLoadOf, rosterTallyOf } from '../../domain/attendance-roster';
import {
  blockKeyOf,
  clampToNavigableRange,
  findBlockByKey,
  navigableDayRange,
} from '../../domain/block-schedule';
import { AttendeeRoster } from '../attendee-roster/attendee-roster';
import { BlockSwitcher } from '../block-switcher/block-switcher';
import { MetricCard } from '../metric-card/metric-card';
import { OccupancyCard } from '../occupancy-card/occupancy-card';

/**
 * One block of the schedule, which is `docs/booking-flow.md` §11's "ver el bloque actual" — except
 * that the current block turned out not to be a special case, only the row the list opens by
 * default. The `BlockSwitcher` stays for the sideways move between adjacent blocks: somebody
 * comparing 14:00 with 16:00 should not have to go back up and come down again.
 *
 * Two reads, and each answers something the other cannot. The day's blocks say which hours this
 * space runs — which is what makes a typed or stale key answerable with "that block is not there"
 * rather than with a room invented for it — and the block's own read brings the roster. The second
 * only runs once the first has recognised the key.
 *
 * Space, day and block all travel in the address, so a block somebody is looking at is a link they
 * can send.
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
    TuiSkeleton,
  ],
  templateUrl: './capacity-detail-page.html',
  styleUrl: './capacity-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapacityDetailPage {
  public readonly spaceId = input.required<string>();
  /** The block's start within its day, as `HH-mm`. The day itself travels in `?date=`. */
  public readonly block = input<string | null>(null);
  public readonly date = input<string | null>(null);
  /** Free text from the panel's bar, which searches the roster of whatever block is open. */
  public readonly query = input<string | null>(null);

  private readonly config = inject(APP_CONFIG);
  private readonly spaces = inject(AdminSpacesStore);
  private readonly repository = inject(AdminBlockRepository);
  private readonly router = inject(Router);

  /**
   * Read once per render rather than on a timer: the panel is a screen somebody is standing in front
   * of, and a count that ticks while they read it is harder to trust than one that matches the list
   * underneath. The countdown belongs to the scanning view, not to this one.
   */
  protected readonly now = new Date();

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

  /** The space's name for the heading. The guard on `:spaceId` already filled this cache. */
  private readonly space = rxResource({
    params: () => this.spaceId(),
    stream: ({ params }) => this.spaces.find(params),
    defaultValue: null,
  });

  protected readonly spaceName = computed(() => this.space.value()?.spaceName ?? '');

  protected readonly schedule = rxResource({
    params: () => ({ spaceId: this.spaceId(), day: this.selectedDay().getTime() }),
    stream: ({ params }) => this.repository.blocksOf(params.spaceId, new Date(params.day)),
    defaultValue: [],
  });

  protected readonly blocksForDay = this.schedule.value;

  /** `undefined` rather than a fallback: a block that is not there is worth saying so about, and
   *  quietly opening a different hour would be a worse answer than an empty state. */
  protected readonly scheduled = computed(() => findBlockByKey(this.blocksForDay(), this.block()));

  protected readonly detail = rxResource({
    params: () => {
      const block = this.scheduled();

      return block
        ? {
            spaceId: this.spaceId(),
            day: this.selectedDay().getTime(),
            start: block.start.getTime(),
          }
        : undefined;
    },
    stream: ({ params }) =>
      this.repository.blockDetail(params.spaceId, new Date(params.day), new Date(params.start)),
    defaultValue: null,
  });

  protected readonly current = this.detail.value;

  protected readonly load = computed(() => {
    const block = this.current();

    return block ? blockLoadOf(block) : null;
  });

  protected readonly tally = computed(() => {
    const block = this.current();

    return block ? rosterTallyOf(block.attendees) : null;
  });

  protected readonly loading = computed(() => this.schedule.isLoading() || this.detail.isLoading());

  protected readonly failed = computed(() => this.schedule.error() ?? this.detail.error());

  protected readonly listParams = computed(() => ({
    date: this.dayParam() === toIsoDate(startOfDay(this.now)) ? null : this.dayParam(),
  }));

  /** The sideways move: same day, same space, a different hour, so only the last segment changes. */
  protected selectBlock(start: number): void {
    const target = this.blocksForDay().find((block) => block.start.getTime() === start);

    if (!target) {
      return;
    }

    void this.router.navigate(['/admin', this.spaceId(), 'blocks', blockKeyOf(target)], {
      queryParams: this.listParams(),
    });
  }

  protected retry(): void {
    this.schedule.reload();
    this.detail.reload();
  }
}
