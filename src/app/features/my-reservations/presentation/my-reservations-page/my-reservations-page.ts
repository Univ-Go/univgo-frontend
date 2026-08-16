import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiAppearance, TuiButton, TuiCheckbox, TuiDropdown, TuiIcon, TuiLink } from '@taiga-ui/core';
import { TuiBadge, TuiBlock, TuiPagination } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';

type ReservationStatus = 'upcoming' | 'ongoing' | 'past';
type SpaceCategory = 'sports' | 'study' | 'lab';

/** Shape of the sample data below. Real models will live in the feature's domain layer. */
interface Reservation {
  readonly id: string;
  readonly spaceName: string;
  readonly date: string;
  readonly time: string;
  readonly status: ReservationStatus;
  readonly category: SpaceCategory;
  readonly icon: string;
}

const RESERVATIONS_PER_PAGE = 4;

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
 * `FormsModule` is only here for `[ngModel]` on the filter checkboxes: `TuiCheckbox` disables
 * itself whenever it has no `NgControl` attached, so a plain `[checked]`/`(change)` pair renders
 * inert. This is lazy-loaded with the route, so it does not touch the initial bundle.
 */
@Component({
  selector: 'app-my-reservations-page',
  imports: [
    FormsModule,
    TuiAppearance,
    TuiBadge,
    TuiBlock,
    TuiButton,
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
      date: '24 oct',
      time: '14:00 – 16:00',
      status: 'upcoming',
      category: 'sports',
      icon: '@tui.volleyball',
    },
    {
      id: 'study-room-3-sep18',
      spaceName: 'Sala de Estudio Grupal 3',
      date: '18 sept',
      time: '09:00 – 11:00',
      status: 'past',
      category: 'study',
      icon: '@tui.book-open',
    },
  ];

  protected readonly selectedStatuses = signal<ReadonlySet<ReservationStatus>>(
    new Set<ReservationStatus>(['upcoming', 'ongoing', 'past']),
  );

  protected readonly selectedCategories = signal<ReadonlySet<SpaceCategory>>(
    new Set<SpaceCategory>(['sports', 'study', 'lab']),
  );

  protected readonly pageIndex = signal(0);

  protected readonly statusFilterOpen = signal(false);
  protected readonly categoryFilterOpen = signal(false);

  protected readonly filteredReservations = computed(() =>
    this.reservations.filter(
      (reservation) =>
        this.selectedStatuses().has(reservation.status) &&
        this.selectedCategories().has(reservation.category),
    ),
  );

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
}
