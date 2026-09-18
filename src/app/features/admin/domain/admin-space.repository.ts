import type { Observable } from 'rxjs';

/**
 * What the panel can do *to* a space's reservations, as opposed to what it can read about one.
 * Taking the space out of service is a closure (`SpaceClosureRepository`), which suspends and can be
 * undone; clearing its reservations is this, and cannot (`docs/booking-flow.md` §12).
 */
export abstract class AdminSpaceRepository {
  /** Answers how many reservations were cancelled, which is what the panel reports back. */
  abstract cancelAllReservations(spaceId: string): Observable<number>;
}
