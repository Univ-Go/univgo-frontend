import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TuiItem } from '@taiga-ui/cdk';
import { TuiAppearance, TuiButton, TuiCarousel, TuiIcon, TuiLink } from '@taiga-ui/core';
import { TuiBreadcrumbs, TuiChip, TuiPager, TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { MediaPlate } from '../../../../shared/media-plate/media-plate';
import { formatTimeOfDay } from '../../../../shared/time/time-of-day';
import { BOOKING_DURATION_MINUTES } from '../../domain/space';
import { SpaceRepository } from '../../domain/space.repository';
import { resolveAvailability } from '../../domain/space-catalog';
import { SpaceAvailabilityBadge } from '../space-availability-badge/space-availability-badge';
import { SpaceBookAction } from '../space-book-action/space-book-action';
import { SpaceBriefing } from '../space-briefing/space-briefing';
import { spaceCategoryIcon, spaceCategoryName } from '../space-category';

const MINUTES_PER_HOUR = 60;

/**
 * The space's own page: everything a card cannot fit — every photograph, what the space is for and
 * the rules of using it — plus the same action the card offers, so arriving here is never a detour
 * on the way to booking.
 *
 * It is reached from the catalogue and not from the booking flow, where a card is something to
 * pick rather than to open, so the page never has to know about the draft.
 *
 * Availability is read for today and resolved by the same domain function the catalogue uses, so
 * the button says exactly what the card said. A space with nothing free today still opens: what
 * changes is the action, and the schedule step is where the other days are.
 */
@Component({
  selector: 'app-space-detail-page',
  imports: [
    EmptyState,
    MediaPlate,
    RouterLink,
    SpaceAvailabilityBadge,
    SpaceBookAction,
    SpaceBriefing,
    TuiAppearance,
    TuiBreadcrumbs,
    TuiButton,
    TuiCardLarge,
    TuiCarousel,
    TuiChip,
    TuiIcon,
    TuiItem,
    TuiLink,
    TuiPager,
    TuiSkeleton,
    TuiSurface,
  ],
  templateUrl: './space-detail-page.html',
  styleUrl: './space-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceDetailPage {
  public readonly id = input<string>();

  private readonly spaces = inject(SpaceRepository);

  /** Read once: a page left open past midnight should not silently change what "today" means. */
  private readonly today = new Date();

  protected readonly resource = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.spaces.findById(params ?? '', this.today),
    defaultValue: null,
  });

  protected readonly space = this.resource.value;

  protected readonly categoryName = spaceCategoryName;

  protected readonly icon = computed(() => {
    const space = this.space();

    return space ? spaceCategoryIcon(space.category) : '';
  });

  protected readonly availability = computed(() => {
    const space = this.space();

    return space
      ? resolveAvailability(space, { category: null, date: this.today, from: null, query: null })
      : null;
  });

  /**
   * When each block that still has room today starts, as a clock reads it. This is what fills the
   * booking panel: whether to walk over now or come back another day is decided by the hours left,
   * and the catalogue already answered them for this date.
   */
  protected readonly freeToday = computed(() =>
    (this.space()?.freeSlots ?? []).map((slot) => formatTimeOfDay(slot.from)),
  );

  protected readonly bookingHours = BOOKING_DURATION_MINUTES / MINUTES_PER_HOUR;

  /** Which photograph of the album is showing; the carousel is bounded to the album's length. */
  protected readonly slide = signal(0);
}
