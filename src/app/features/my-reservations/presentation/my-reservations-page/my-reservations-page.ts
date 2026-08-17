import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiDay, TuiDayRange } from '@taiga-ui/cdk';
import { TuiAppearance, TuiButton, TuiCheckbox, TuiDropdown, TuiIcon, TuiLink } from '@taiga-ui/core';
import { TuiBadge, TuiBlock, TuiCalendarRange, TuiPagination } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';

type ReservationStatus = 'upcoming' | 'ongoing' | 'past';
type SpaceCategory = 'sports' | 'study' | 'lab';

/** Shape of the sample data below. Real models will live in the feature's domain layer. */
interface Reservation {
  readonly id: string;
  readonly spaceName: string;
  readonly date: Date;
  readonly time: string;
  readonly status: ReservationStatus;
  readonly category: SpaceCategory;
  readonly icon: string;
}

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
 * Visual mock: layout and component inventory are final, the data is not. The two sample
 * reservations below are the feature's only hardcoded source — they move to a use case once the
 * booking API exists. Filtering and pagination run as real client-side logic over that sample; it
 * is not a simulation of a backend.
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
    DatePipe,
    FormsModule,
    TuiAppearance,
    TuiBadge,
    TuiBlock,
    TuiButton,
    TuiCalendarRange,
    TuiCardLarge,
    TuiCheckbox,
    TuiDropdown,
    TuiIcon,
    TuiLink,
    TuiPagination,
    TuiSurface,
  ],
  templateUrl: './my-reservations-page.html',
  styleUrl: './my-reservations-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyReservationsPage {
  protected readonly reservations: readonly Reservation[] = [
    {
      id: 'court-a-oct24',
      spaceName: 'Cancha de Básquetbol A',
      date: new Date(2026, 9, 24),
      time: '14:00 – 16:00',
      status: 'upcoming',
      category: 'sports',
      icon: '@tui.volleyball',
    },
    {
      id: 'study-room-3-mar18',
      spaceName: 'Sala de Estudio Grupal 3',
      date: new Date(2026, 2, 18),
      time: '09:00 – 11:00',
      status: 'past',
      category: 'study',
      icon: '@tui.book-open',
    },
    {
      id: 'lab-chemistry-2-aug16',
      spaceName: 'Laboratorio de Química 2',
      date: new Date(2026, 7, 16),
      time: '15:00 – 17:00',
      status: 'ongoing',
      category: 'lab',
      icon: '@tui.flask-conical',
    },
    {
      id: 'court-tennis-b-feb2',
      spaceName: 'Cancha de Tenis B',
      date: new Date(2026, 1, 2),
      time: '08:00 – 09:00',
      status: 'past',
      category: 'sports',
      icon: '@tui.volleyball',
    },
    {
      id: 'reading-room-sept30',
      spaceName: 'Sala de Lectura Silenciosa',
      date: new Date(2026, 8, 30),
      time: '10:00 – 12:00',
      status: 'upcoming',
      category: 'study',
      icon: '@tui.book-open',
    },
    {
      id: 'lab-physics-aug16',
      spaceName: 'Laboratorio de Física',
      date: new Date(2026, 7, 16),
      time: '11:00 – 13:00',
      status: 'ongoing',
      category: 'lab',
      icon: '@tui.flask-conical',
    },
  ];

  protected readonly selectedStatuses = signal<ReadonlySet<ReservationStatus>>(
    new Set<ReservationStatus>(['upcoming', 'ongoing', 'past']),
  );

  protected readonly selectedCategories = signal<ReadonlySet<SpaceCategory>>(
    new Set<SpaceCategory>(['sports', 'study', 'lab']),
  );

  protected readonly pageIndex = signal(0);

  protected readonly selectedRange = signal<TuiDayRange | null>(null);

  protected readonly statusFilterOpen = signal(false);
  protected readonly categoryFilterOpen = signal(false);
  protected readonly dateFilterOpen = signal(false);

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
