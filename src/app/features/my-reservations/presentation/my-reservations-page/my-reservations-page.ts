import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import type { TuiDayRange } from '@taiga-ui/cdk';
import { TuiLink } from '@taiga-ui/core';
import { TuiCalendarRange, TuiPagination } from '@taiga-ui/kit';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import type { SpaceCategory } from '../../../spaces/domain/space';
import { SPACE_CATEGORIES } from '../../../spaces/domain/space';
import type { ReservationStatus } from '../../domain/reservation';
import { RESERVATION_STATUSES } from '../../domain/reservation';
import { listReservations } from '../../domain/reservation-catalog';
import { MOCK_RESERVATIONS } from '../../infrastructure/mock-reservations';
import { CheckboxFilter } from '../checkbox-filter/checkbox-filter';
import { FilterDropdown } from '../filter-dropdown/filter-dropdown';
import { ReservationCard } from '../reservation-card/reservation-card';
import { RESERVATION_CATEGORY_OPTIONS, RESERVATION_STATUS_OPTIONS } from '../reservation-filters';

const RESERVATIONS_PER_PAGE = 6;

function toggle<T>(set: ReadonlySet<T>, value: T, checked: boolean): ReadonlySet<T> {
  const next = new Set(set);

  if (checked) {
    next.add(value);
  } else {
    next.delete(value);
  }

  return next;
}

/**
 * Visual mock: layout and component inventory are final, the data is not. `MOCK_RESERVATIONS` is
 * the feature's only hardcoded source, shared with the detail view so both read the same
 * reservation by id — it moves to a use case behind a domain port once the booking API exists.
 * Filtering runs as real logic over that sample, in `reservation-catalog.ts` and not here: which
 * bookings answer a question is a rule, the same way the space catalogue's is. The view owns the
 * controls, the paging and the empty state; rendering one reservation belongs to
 * `ReservationCard`.
 *
 * The date filter is a single `TuiCalendarRange` so a user picks days visually rather than typing
 * them: clicking one day twice (or once, then Escape) commits it as a single-day range, clicking
 * two different days commits a range — one control for both cases, matching `TuiDayRange`'s own
 * model where a single day is a range with `from === to`. This is lazy-loaded with the route, so it
 * does not touch the initial bundle.
 */
@Component({
  selector: 'app-my-reservations-page',
  imports: [
    CheckboxFilter,
    EmptyState,
    FilterDropdown,
    ReservationCard,
    TuiCalendarRange,
    TuiLink,
    TuiPagination,
  ],
  templateUrl: './my-reservations-page.html',
  styleUrl: './my-reservations-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyReservationsPage {
  protected readonly reservations = MOCK_RESERVATIONS;

  protected readonly statusOptions = RESERVATION_STATUS_OPTIONS;
  protected readonly categoryOptions = RESERVATION_CATEGORY_OPTIONS;

  protected readonly statusLabel = $localize`:@@reservations.filters.status.label:Estado`;
  protected readonly categoryLabel = $localize`:@@reservations.filters.category.label:Tipo de espacio`;
  protected readonly dateLabel = $localize`:@@reservations.filters.date.label:Fecha`;

  protected readonly selectedStatuses = signal<ReadonlySet<ReservationStatus>>(
    new Set(RESERVATION_STATUSES),
  );

  protected readonly selectedCategories = signal<ReadonlySet<SpaceCategory>>(
    new Set(SPACE_CATEGORIES),
  );

  protected readonly pageIndex = signal(0);

  protected readonly selectedRange = signal<TuiDayRange | null>(null);

  /** A closed dropdown gives no hint of what is applied, so the trigger carries the state itself. */
  protected readonly dateFilterActive = computed(() => this.selectedRange() !== null);

  /** The calendar speaks in `TuiDay`; the catalogue speaks in dates. This is where that ends. */
  protected readonly filteredReservations = computed(() => {
    const range = this.selectedRange();

    return listReservations(this.reservations, {
      statuses: this.selectedStatuses(),
      categories: this.selectedCategories(),
      from: range?.from.toLocalNativeDate() ?? null,
      to: range?.to.toLocalNativeDate() ?? null,
    });
  });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filteredReservations().length / RESERVATIONS_PER_PAGE)),
  );

  protected readonly pagedReservations = computed(() => {
    const start = Math.min(this.pageIndex(), this.pageCount() - 1) * RESERVATIONS_PER_PAGE;

    return this.filteredReservations().slice(start, start + RESERVATIONS_PER_PAGE);
  });

  protected toggleStatus(status: ReservationStatus, checked: boolean): void {
    this.selectedStatuses.update((current) => toggle(current, status, checked));
    this.pageIndex.set(0);
  }

  protected toggleCategory(category: SpaceCategory, checked: boolean): void {
    this.selectedCategories.update((current) => toggle(current, category, checked));
    this.pageIndex.set(0);
  }

  protected setSelectedRange(range: TuiDayRange | null): void {
    this.selectedRange.set(range);
    this.pageIndex.set(0);
  }
}
