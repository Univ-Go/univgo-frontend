import type { Observable } from 'rxjs';

/**
 * What the panel can do *to* a space, as opposed to what it can read about one. Taking it out of
 * service and clearing its reservations are two actions and stay two: `docs/booking-flow.md` §10
 * says a space under maintenance offers no blocks, and that the bookings it already had are
 * cancelled from the panel — the second does not follow from the first, because a closure announced
 * for next week should not empty today.
 */
export abstract class AdminSpaceRepository {
  abstract setMaintenance(spaceId: string, underMaintenance: boolean): Observable<void>;

  /** Answers how many reservations were cancelled, which is what the panel reports back. */
  abstract cancelAllReservations(spaceId: string): Observable<number>;
}
