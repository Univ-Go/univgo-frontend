import type { SpaceCategory } from '../../spaces/domain/space';

/**
 * The five states of `docs/booking-flow.md` §7. They are never stored: the server derives each one
 * from its own clock on every read, and the interface only renders what it was told. `expired` and
 * `cancelled` stay apart on purpose — one happened to the student, the other was their decision,
 * and seeing which is what explains why the plaza is gone.
 */
export type ReservationState = 'reserved' | 'inProgress' | 'finished' | 'expired' | 'cancelled';

/** Declaration order is the order a filter offers the states in: what is live first, history after. */
export const RESERVATION_STATES: readonly ReservationState[] = [
  'reserved',
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
  readonly date: Date;
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly state: ReservationState;
  readonly checkInOpensAt: Date;
  readonly checkInClosesAt: Date;
}

/**
 * A booking that still holds a plaza. Both halves of "está en juego": it is what the dashboard
 * offers as the next one, and what separates the live list from the history.
 */
export function isActive(reservation: Reservation): boolean {
  return reservation.state === 'reserved' || reservation.state === 'inProgress';
}

/**
 * Cancelling is only the student's to do while the plaza is still waiting for them: once they have
 * checked in the block is being used, and the server refuses it (`docs/booking-flow.md` §7). The
 * rule is stated here so the button and the guard against a stale list read the same one.
 */
export function isCancellable(reservation: Reservation): boolean {
  return reservation.state === 'reserved';
}
