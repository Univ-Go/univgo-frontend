import type { Observable } from 'rxjs';
import type { Reservation } from './reservation';

/**
 * What the student answers in the booking flow, which is the whole of what a reservation is made
 * of: the rest — who, the code, the check-in window, the state — is the server's to decide.
 */
export interface BookingRequest {
  readonly spaceId: string;
  readonly date: Date;
  readonly startMinutes: number;
}

/**
 * The student's own reservations, from creating one to giving it up. It lives with the feature that
 * lists them rather than with the booking flow because this is where a reservation is read, kept
 * and cancelled; `booking` is one caller of `create`, the same way it is one caller of the space
 * catalogue.
 */
export abstract class ReservationRepository {
  abstract create(request: BookingRequest): Observable<Reservation>;

  abstract mine(): Observable<readonly Reservation[]>;

  /** Answers `null` for a reservation that is not the student's or no longer exists. */
  abstract findById(id: string): Observable<Reservation | null>;

  /** Answers the reservation as it stands after being given up, so the caller need not re-read it. */
  abstract cancel(id: string): Observable<Reservation>;
}
