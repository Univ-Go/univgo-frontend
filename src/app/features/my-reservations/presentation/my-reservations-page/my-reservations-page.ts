import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiDay, TuiDayRange } from '@taiga-ui/cdk';
import { TuiButton, TuiCheckbox, TuiDropdown, TuiLink } from '@taiga-ui/core';
import { TuiBlock, TuiCalendarRange, TuiPagination } from '@taiga-ui/kit';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import type { SpaceCategory } from '../../../spaces/domain/space';
import { SPACE_CATEGORIES } from '../../../spaces/domain/space';
import type { ReservationStatus } from '../../domain/reservation';
import { MOCK_RESERVATIONS } from '../../infrastructure/mock-reservations';
import { ReservationCard } from '../reservation-card/reservation-card';

const RESERVATIONS_PER_PAGE = 6;

const ALL_STATUSES: readonly ReservationStatus[] = ['upcoming', 'ongoing', 'past'];

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
 * Filtering and pagination run as real client-side logic over that sample; it is not a simulation
 * of a backend. The view owns filtering, paging and the empty state; rendering one reservation
 * belongs to `ReservationCard`.
 *
 * `FormsModule` is only here for `[ngModel]` on the status/category checkboxes: `TuiCheckbox`
 * disables itself whenever it has no `NgControl` attached, so a plain `[checked]`/`(change)` pair
 * renders inert. The date filter is a single `TuiCalendarRange`, driven by a `[value]`/`(valueChange)`
 * model signal, so a user picks a date visually rather than typing one: clicking one day twice (or
 * once, then Escape) commits it as a single-day range, clicking two different days commits a range —
 * one control for both cases, matching `TuiDayRange`'s own `from`/`to` model where a single day is
 * just a range with `from === to`. This is lazy-loaded with the route, so it does not touch the
 * initial bundle.
 */
@Component({
  selector: 'app-my-reservations-page',
  imports: [
    EmptyState,
    FormsModule,
    ReservationCard,
    TuiBlock,
    TuiButton,
    TuiCalendarRange,
    TuiCheckbox,
    TuiDropdown,
    TuiLink,
    TuiPagination,
  ],
  templateUrl: './my-reservations-page.html',
  styleUrl: './my-reservations-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyReservationsPage {
  protected readonly reservations = MOCK_RESERVATIONS;

  protected readonly selectedStatuses = signal<ReadonlySet<ReservationStatus>>(
    new Set(ALL_STATUSES),
  );

  protected readonly selectedCategories = signal<ReadonlySet<SpaceCategory>>(
    new Set(SPACE_CATEGORIES),
  );

  protected readonly pageIndex = signal(0);

  protected readonly selectedRange = signal<TuiDayRange | null>(null);

  protected readonly statusFilterOpen = signal(false);
  protected readonly categoryFilterOpen = signal(false);
  protected readonly dateFilterOpen = signal(false);

  /**
   * A closed dropdown gives no hint of what is applied, so the trigger carries the state itself.
   * "Narrowing anything down" is the condition, which for the checkbox filters means any option
   * left out — including all of them, where the list legitimately comes back empty.
   */
  protected readonly statusFilterActive = computed(
    () => this.selectedStatuses().size < ALL_STATUSES.length,
  );

  protected readonly categoryFilterActive = computed(
    () => this.selectedCategories().size < SPACE_CATEGORIES.length,
  );

  protected readonly dateFilterActive = computed(() => this.selectedRange() !== null);

  protected readonly filteredReservations = computed(() => {
    const range = this.selectedRange();

    return this.reservations.filter((reservation) => {
      if (!this.selectedStatuses().has(reservation.status)) {
        return false;
      }

      if (!this.selectedCategories().has(reservation.category)) {
        return false;
      }

      return !range || range.dayInRange(TuiDay.fromLocalNativeDate(reservation.date));
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
