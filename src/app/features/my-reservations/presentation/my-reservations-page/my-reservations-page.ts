import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import type { TuiDayRange } from '@taiga-ui/cdk';
import { TuiButton, TuiDialogService, TuiLink } from '@taiga-ui/core';
import { TuiCalendarRange, TuiPagination, TuiSkeleton, TUI_CONFIRM } from '@taiga-ui/kit';
import { defaultIfEmpty } from 'rxjs';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { CheckboxFilter } from '../../../../shared/checkbox-filter/checkbox-filter';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { FilterDropdown } from '../../../../shared/filter-dropdown/filter-dropdown';
import type { SpaceCategory } from '../../../spaces/domain/space';
import { SPACE_CATEGORIES } from '../../../spaces/domain/space';
import type { Reservation, ReservationState } from '../../domain/reservation';
import { RESERVATION_STATES } from '../../domain/reservation';
import { ReservationRepository } from '../../domain/reservation.repository';
import { listReservations } from '../../domain/reservation-catalog';
import { ReservationCard } from '../reservation-card/reservation-card';
import { RESERVATION_CATEGORY_OPTIONS, RESERVATION_STATE_OPTIONS } from '../reservation-filters';

const RESERVATIONS_PER_PAGE = 6;

/** Placeholder cards drawn while the list loads: a screenful, not the whole page. */
const SKELETON_CARDS = Array.from({ length: 3 }, (_, index) => index);

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
 * The student's own bookings, read from the server and narrowed in the browser: which ones answer
 * the question is a rule and lives in `reservation-catalog.ts`, the same way the space catalogue's
 * does. The view owns the controls, the paging and the empty states; rendering one booking belongs
 * to `ReservationCard`.
 *
 * Cancelling is confirmed with a dialog rather than an alert because it is not reversible: the
 * plaza goes back to the block the moment it happens. Afterwards the list is read again instead of
 * being patched in place — the server decides every state from its own clock, so a list edited
 * here would start disagreeing with it on the next tick.
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
    RouterLink,
    TuiButton,
    TuiCalendarRange,
    TuiLink,
    TuiPagination,
    TuiSkeleton,
  ],
  templateUrl: './my-reservations-page.html',
  styleUrl: './my-reservations-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyReservationsPage {
  private readonly repository = inject(ReservationRepository);
  private readonly dialogs = inject(TuiDialogService);
  private readonly notifications = inject(NotificationService);

  protected readonly reservations = rxResource({
    stream: () => this.repository.mine(),
    defaultValue: [],
  });

  protected readonly skeletonCards = SKELETON_CARDS;

  /** The booking whose cancellation is in flight, so only its own card reports the wait. */
  protected readonly cancellingId = signal<string | null>(null);

  protected readonly stateOptions = RESERVATION_STATE_OPTIONS;
  protected readonly categoryOptions = RESERVATION_CATEGORY_OPTIONS;

  protected readonly stateLabel = $localize`:@@reservations.filters.state.label:Estado`;
  protected readonly categoryLabel = $localize`:@@reservations.filters.category.label:Tipo de espacio`;
  protected readonly dateLabel = $localize`:@@reservations.filters.date.label:Fecha`;

  protected readonly selectedStates = signal<ReadonlySet<ReservationState>>(
    new Set(RESERVATION_STATES),
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

    return listReservations(this.reservations.value(), {
      states: this.selectedStates(),
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

  protected toggleState(state: ReservationState, checked: boolean): void {
    this.selectedStates.update((current) => toggle(current, state, checked));
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

  /**
   * `defaultIfEmpty` is not defensive noise: dismissing a Taiga dialog with Escape or the backdrop
   * completes it without emitting, and dismissing the question means keeping the booking.
   */
  protected confirmCancel(reservation: Reservation): void {
    if (this.cancellingId()) {
      return;
    }

    this.dialogs
      .open<boolean>(TUI_CONFIRM, {
        size: 's',
        label: $localize`:@@reservations.cancel.title:¿Cancelar esta reserva?`,
        data: {
          content: $localize`:@@reservations.cancel.content:La plaza volverá a estar disponible para otras personas y podrás reservar otro bloque hoy.`,
          yes: $localize`:@@reservations.cancel.confirm:Cancelar la reserva`,
          no: $localize`:@@reservations.cancel.keep:Conservarla`,
          appearance: 'primary-destructive',
        },
      })
      .pipe(defaultIfEmpty(false))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.cancel(reservation);
        }
      });
  }

  private cancel(reservation: Reservation): void {
    this.cancellingId.set(reservation.id);

    this.repository.cancel(reservation.id).subscribe({
      next: () => {
        this.cancellingId.set(null);
        this.notifications.success(
          $localize`:@@reservations.cancel.done.summary:Reserva cancelada`,
          $localize`:@@reservations.cancel.done.detail:La plaza ya está disponible para otras personas.`,
        );
        this.reservations.reload();
      },
      // The failure is already announced by the interceptor; what is left is to stop showing a
      // booking in a state the server just disagreed with.
      error: () => {
        this.cancellingId.set(null);
        this.reservations.reload();
      },
    });
  }
}
