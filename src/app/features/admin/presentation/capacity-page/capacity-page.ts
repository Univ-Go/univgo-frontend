import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { countExpiringSoon, occupancyOf } from '../../domain/attendance-roster';
import { MOCK_SPACE_SCHEDULE, MOCK_SPACES } from '../../infrastructure/mock-attendance';
import { AttendeeRoster } from '../attendee-roster/attendee-roster';
import { BlockSwitcher } from '../block-switcher/block-switcher';
import { MetricCard } from '../metric-card/metric-card';
import { OccupancyCard } from '../occupancy-card/occupancy-card';
import { SpaceSwitcher } from '../space-switcher/space-switcher';

/**
 * Visual mock: layout and component inventory are final, the data is not. `MOCK_SPACES` is the
 * panel's only hardcoded source, and every number on screen is derived from the selected block by
 * the domain — how many seats are held, how many are free, how many reservations are about to be
 * lost — rather than written beside it. It moves behind a port once the check-in API exists.
 *
 * The search text comes from the query string because the field that fills it lives in the panel's
 * bar, which is part of the shell and not of this view: the URL is the one place both can read
 * without either importing the other. It also makes a filtered roster a link somebody can send.
 *
 * `docs/booking-flow.md` §11 asks the panel for four things. This covers two of them: seeing a block
 * and consulting others — the same view, since "the current one" is just the default entry in the
 * list `BlockSwitcher` already renders. Scanning and cancelling stay their own views.
 */
@Component({
  selector: 'app-capacity-page',
  imports: [AttendeeRoster, BlockSwitcher, MetricCard, OccupancyCard, SpaceSwitcher, TuiButton],
  templateUrl: './capacity-page.html',
  styleUrl: './capacity-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapacityPage {
  /** Bound from `?query=` by the router, which is where the panel's search bar writes it. */
  public readonly query = input<string | null>(null);

  protected readonly spaces = MOCK_SPACES;

  /** Which of the administrator's spaces this page is showing. Page-local: the shell has no say. */
  protected readonly selectedSpaceId = signal(MOCK_SPACES[0].spaceId);

  /**
   * Which of that space's blocks this page is showing, as its start instant. Every space shares the
   * same opening-to-closing grid, so a slot stays selected across a space change instead of bouncing
   * back to "now" — the administrator asked to see 16:00, not to see whichever space is showing it.
   */
  protected readonly selectedBlockStart = signal(MOCK_SPACES[0].start.getTime());

  protected readonly blocksForSpace = computed(() =>
    MOCK_SPACE_SCHEDULE.filter((block) => block.spaceId === this.selectedSpaceId()),
  );

  protected readonly block = computed(
    () =>
      this.blocksForSpace().find((block) => block.start.getTime() === this.selectedBlockStart()) ??
      this.blocksForSpace()[0],
  );

  protected readonly occupancy = computed(() => occupancyOf(this.block()));

  /**
   * Read once per render of the view rather than on a timer: the panel is a screen somebody is
   * standing in front of, and a count that ticks while they read it is harder to trust than one
   * that matches the list underneath. The countdown belongs to the scanning view, not to this one.
   */
  protected readonly expiringSoon = computed(() => countExpiringSoon(this.block(), new Date()));

  /** No warning icon when there is nothing to warn about: "none" is good news, not an alert. */
  protected readonly expiryIcon = computed(() =>
    this.expiringSoon() > 0 ? '@tui.triangle-alert' : null,
  );

  protected selectSpace(spaceId: string): void {
    this.selectedSpaceId.set(spaceId);
  }

  protected selectBlock(start: number): void {
    this.selectedBlockStart.set(start);
  }
}
