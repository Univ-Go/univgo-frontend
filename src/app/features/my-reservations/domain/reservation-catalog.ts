import type { SpaceCategory } from '../../spaces/domain/space';
import type { Reservation, ReservationState } from './reservation';
import { isActive } from './reservation';

/**
 * The question the list view asks of the bookings on record. Both ends of the range are days, not
 * instants, and both are inclusive: a booking is filtered by the day it falls on, so the time of
 * day never decides whether it shows. A `null` end is unbounded on that side.
 */
export interface ReservationFilter {
  readonly states: ReadonlySet<ReservationState>;
  readonly categories: ReadonlySet<SpaceCategory>;
  readonly from: Date | null;
  readonly to: Date | null;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function isWithinDays(date: Date, from: Date | null, to: Date | null): boolean {
  const day = startOfDay(date);

  return (from === null || day >= startOfDay(from)) && (to === null || day <= startOfDay(to));
}

function chronologically(one: Reservation, other: Reservation): number {
  return one.date.getTime() - other.date.getTime() || one.startMinutes - other.startMinutes;
}

/**
 * How a student reads their own list: what still holds a plaza first and soonest at the top,
 * because that is what they may still have to act on, and the history after it with the most
 * recent first. The server answers in no particular order, so ranking is the reading's job — and
 * it belongs here, with the filtering, rather than in the view that happens to paginate it.
 */
function byRelevance(one: Reservation, other: Reservation): number {
  const live = Number(isActive(other)) - Number(isActive(one));
  const order = chronologically(one, other);

  return live || (isActive(one) ? order : -order);
}

/**
 * Every condition narrows: an empty set of states or of categories legitimately answers with
 * nothing, because the user did untick every option.
 */
export function listReservations(
  reservations: readonly Reservation[],
  filter: ReservationFilter,
): readonly Reservation[] {
  return reservations
    .filter(
      (reservation) =>
        filter.states.has(reservation.state) &&
        filter.categories.has(reservation.category) &&
        isWithinDays(reservation.date, filter.from, filter.to),
    )
    .sort(byRelevance);
}

/**
 * The soonest booking that still holds a plaza, which is the only one a dashboard has room to show.
 * Whether a booking is still live reads its state and not the clock: the server already answered
 * that question, and answering it again from the date here would give two answers to one.
 */
export function findNextReservation(reservations: readonly Reservation[]): Reservation | undefined {
  return reservations.filter(isActive).sort(chronologically).at(0);
}
