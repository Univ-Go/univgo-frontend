import type { SpaceCategory } from '../../spaces/domain/space';
import type { Reservation, ReservationStatus } from './reservation';

/**
 * The question the list view asks of the bookings on record. Both ends of the range are days, not
 * instants, and both are inclusive: a booking is filtered by the day it falls on, so the time of
 * day never decides whether it shows. A `null` end is unbounded on that side.
 */
export interface ReservationFilter {
  readonly statuses: ReadonlySet<ReservationStatus>;
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

/**
 * Every condition narrows: an empty set of statuses or of categories legitimately answers with
 * nothing, because the user did untick every option. Input order is preserved — how the bookings
 * are ranked is not settled yet, and inventing an order here would decide it silently.
 */
export function listReservations(
  reservations: readonly Reservation[],
  filter: ReservationFilter,
): readonly Reservation[] {
  return reservations.filter(
    (reservation) =>
      filter.statuses.has(reservation.status) &&
      filter.categories.has(reservation.category) &&
      isWithinDays(reservation.date, filter.from, filter.to),
  );
}

/**
 * The soonest booking that has not finished, which is the only one a dashboard has room to show.
 * "Not finished" reads the status rather than the clock: whether a booking is over is what the
 * status records, and deriving it from the date again here would give two answers to one question.
 */
export function findNextReservation(reservations: readonly Reservation[]): Reservation | undefined {
  return reservations
    .filter((reservation) => reservation.status !== 'past')
    .sort((one, other) => one.date.getTime() - other.date.getTime())
    .at(0);
}
