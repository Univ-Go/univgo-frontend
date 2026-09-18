import type { ClosureReason } from '../../spaces/domain/closure-reason';
import type { SpaceCategory } from '../../spaces/domain/space';

/**
 * The states of `docs/booking-flow.md` §7 and §12. They are never stored: the server derives each
 * one from its own clock on every read, and the interface only renders what it was told. `expired`
 * and `cancelled` stay apart on purpose — one happened to the student, the other was their decision,
 * and seeing which is what explains why the plaza is gone. `suspended` is a booking whose block
 * falls inside a closure of the space: it keeps its plaza and comes back if the closure is reverted.
 */
export type ReservationState =
  'reserved' | 'suspended' | 'inProgress' | 'finished' | 'expired' | 'cancelled';

/** Declaration order is the order a filter offers the states in: what is live first, history after. */
export const RESERVATION_STATES: readonly ReservationState[] = [
  'reserved',
  'suspended',
  'inProgress',
  'finished',
  'expired',
  'cancelled',
];

/**
 * A booking as the student sees it. The space's identity travels with it rather than as an id to
 * resolve later: every view that shows a reservation shows which space it is for, and a list that
 * had to look each one up would be a request per row.
 *
 * Hours are minutes from midnight, like `SpaceSlot` and `SpaceBlock`, so formatting and comparing
 * stay arithmetic instead of string parsing.
 */
export interface Reservation {
  readonly id: string;
  /** What the QR encodes and what an administrator's scanner reads; also the code shown as text. */
  readonly code: string;
  readonly spaceId: string;
  readonly spaceName: string;
  readonly location: string;
  readonly category: SpaceCategory;
  readonly images: readonly string[];
  readonly date: Date;
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly state: ReservationState;
  readonly checkInOpensAt: Date;
  readonly checkInClosesAt: Date;
  /** Who gave the booking up, set only when it is `cancelled`. */
  readonly cancelledBy: Canceller | null;
  /** Why the space is shut, set when a closure suspended the booking or ended it. */
  readonly closureReason: ClosureReason | null;
}

export type Canceller = 'student' | 'admin';

/**
 * Why a booking is not going ahead as booked when somebody other than the student decided it —
 * the case a bare state cannot explain (`docs/booking-flow.md` §12, "Qué ve cada uno"). A booking
 * the student gave up themselves needs no explanation, so it has none.
 */
export type ReservationInterruption = 'suspended' | 'spaceClosed' | 'cancelledByAdmin';

export function interruptionOf(reservation: Reservation): ReservationInterruption | null {
  if (reservation.state === 'suspended') {
    return 'suspended';
  }

  if (reservation.state !== 'cancelled' || reservation.cancelledBy !== 'admin') {
    return null;
  }

  return reservation.closureReason === null ? 'cancelledByAdmin' : 'spaceClosed';
}

/**
 * A booking that still holds a plaza. Both halves of "está en juego": it is what the dashboard
 * offers as the next one, and what separates the live list from the history. A suspended booking
 * is one of them — it keeps its plaza, and the student most needs to see it.
 */
export function isActive(reservation: Reservation): boolean {
  return (
    reservation.state === 'reserved' ||
    reservation.state === 'suspended' ||
    reservation.state === 'inProgress'
  );
}

/**
 * A booking whose pass can still be shown at the desk. A suspended one holds a plaza but cannot be
 * checked in against while the space is shut, so its code would only be refused at the door.
 */
export function hasUsablePass(reservation: Reservation): boolean {
  return reservation.state === 'reserved' || reservation.state === 'inProgress';
}

/**
 * Cancelling is only the student's to do while the plaza is still waiting for them: once they have
 * checked in the block is being used, and the server refuses it (`docs/booking-flow.md` §7). A
 * suspended booking is left out too: under the closure its own clock keeps running, and the server
 * refuses it once the check-in window it cannot meet has passed. The rule is stated here so the
 * button and the guard against a stale list read the same one.
 */
export function isCancellable(reservation: Reservation): boolean {
  return reservation.state === 'reserved';
}
