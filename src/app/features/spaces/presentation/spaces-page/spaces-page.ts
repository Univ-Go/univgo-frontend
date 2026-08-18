import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TuiDay, TuiTime } from '@taiga-ui/cdk';
import { TuiAppearance, TuiButton, TuiDataList } from '@taiga-ui/core';
import { TuiInputDate, TuiInputTime, TuiPagination, TuiSelect } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import type { SpaceCategory, SpaceFilter } from '../../domain/space';
import { SPACE_CATEGORIES } from '../../domain/space';
import { groupByCategory, isFilterActive, listSpaces } from '../../domain/space-catalog';
import { MOCK_SPACES } from '../../infrastructure/mock-spaces';
import { SpaceCard } from '../space-card/space-card';
import { spaceCategoryName } from '../space-category';
import { SpaceShelf } from '../space-shelf/space-shelf';

const SPACES_PER_PAGE = 9;

/** A rail is a preview, not a list: past this many cards, "Ver todos" is the honest way through. */
const SHELF_LIMIT = 10;

const MINUTES_PER_HOUR = 60;

/** The window campus spaces open in, and the granularity bookings are made at. */
const OPENING_HOUR = 7;
const CLOSING_HOUR = 21;
const SLOT_MINUTES = 30;

function toMinutes(time: TuiTime | null): number | null {
  return time === null ? null : time.hours * MINUTES_PER_HOUR + time.minutes;
}

/** Offering the bookable times beats asking someone to type one, above all on a phone. */
function bookableTimes(): readonly TuiTime[] {
  const span = (CLOSING_HOUR - OPENING_HOUR) * MINUTES_PER_HOUR;

  return Array.from({ length: span / SLOT_MINUTES + 1 }, (_, step) => {
    const minutes = OPENING_HOUR * MINUTES_PER_HOUR + step * SLOT_MINUTES;

    return new TuiTime(Math.floor(minutes / MINUTES_PER_HOUR), minutes % MINUTES_PER_HOUR);
  });
}

/** The category arrives from the query string, so anything that is not a known category is ignored. */
function toCategory(value: unknown): SpaceCategory | null {
  return SPACE_CATEGORIES.includes(value as SpaceCategory) ? (value as SpaceCategory) : null;
}

/**
 * Visual mock: layout and component inventory are final, the data is not. `MOCK_SPACES` is the
 * feature's only hardcoded source; filtering, ranking and grouping run as real domain logic over
 * that sample and move behind a port once the spaces API exists.
 *
 * The view has two states, and which one is showing is decided by the domain, not by a flag here:
 * with nothing asked for it browses by category in rails, and the moment a request exists — a
 * category, another day, a start time — it answers with one ranked, paginated list. That is what
 * keeps a shelf's "Ver todos" from being a second, near-identical screen: it sets the category
 * filter and this same view changes shape.
 *
 * The category lives in the query string rather than in a signal so that "Ver todos" is a real
 * link: it can be shared, and Back returns to the rails instead of leaving the page. Day and time
 * stay local — they are the shape of one session's question, not an address.
 *
 * `FormsModule` is here for `[ngModel]` on the filter controls: Taiga's textfield directives extend
 * `TuiControl` and render inert without an `NgControl` attached.
 */
@Component({
  selector: 'app-spaces-page',
  imports: [
    EmptyState,
    FormsModule,
    SpaceCard,
    SpaceShelf,
    TuiAppearance,
    TuiButton,
    TuiCardLarge,
    TuiDataList,
    TuiInputDate,
    TuiInputTime,
    TuiPagination,
    TuiSelect,
    TuiSurface,
  ],
  templateUrl: './spaces-page.html',
  styleUrl: './spaces-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpacesPage {
  public readonly category = input(null, { transform: toCategory });

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly categories = SPACE_CATEGORIES;
  protected readonly categoryName = spaceCategoryName;
  protected readonly timeOptions = bookableTimes();

  /** Read once: a page that is open past midnight should not silently change what "today" means. */
  protected readonly today = TuiDay.currentLocal();

  protected readonly date = signal(this.today);
  protected readonly from = signal<TuiTime | null>(null);
  protected readonly to = signal<TuiTime | null>(null);

  protected readonly filter = computed<SpaceFilter>(() => ({
    category: this.category(),
    date: this.date().toLocalNativeDate(),
    from: toMinutes(this.from()),
    to: toMinutes(this.to()),
  }));

  protected readonly filterActive = computed(() =>
    isFilterActive(this.filter(), this.today.toLocalNativeDate()),
  );

  protected readonly listed = computed(() => listSpaces(MOCK_SPACES, this.filter()));

  protected readonly shelves = computed(() =>
    groupByCategory(this.listed()).map((group) => ({
      category: group.category,
      spaces: group.spaces.slice(0, SHELF_LIMIT),
      total: group.spaces.length,
    })),
  );

  /** Answering a new question from page four would show results nobody asked to skip. */
  protected readonly pageIndex = linkedSignal({
    source: this.filter,
    computation: () => 0,
  });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.listed().length / SPACES_PER_PAGE)),
  );

  protected readonly pagedSpaces = computed(() => {
    const start = Math.min(this.pageIndex(), this.pageCount() - 1) * SPACES_PER_PAGE;

    return this.listed().slice(start, start + SPACES_PER_PAGE);
  });

  /** An end time on its own narrows nothing, and one that precedes the start is not a window. */
  protected readonly endWithoutStart = computed(() => this.from() === null && this.to() !== null);

  protected readonly endBeforeStart = computed(() => {
    const from = this.from();
    const to = this.to();

    return from !== null && to !== null && to.valueOf() <= from.valueOf();
  });

  protected selectCategory(category: SpaceCategory | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category },
      queryParamsHandling: 'merge',
    });
  }

  protected setDate(day: TuiDay | null): void {
    this.date.set(day ?? this.today);
  }

  protected clearFilters(): void {
    this.date.set(this.today);
    this.from.set(null);
    this.to.set(null);
    this.selectCategory(null);
  }
}
