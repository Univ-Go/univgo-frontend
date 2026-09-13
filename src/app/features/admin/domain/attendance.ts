/**
 * The five states of a reservation, as `docs/booking-flow.md` §7 defines them. The panel is the only
 * surface that sees all of them at once: a student ever looks at one reservation, their own.
 */
export type CheckInStatus = 'in_progress' | 'reserved' | 'completed' | 'expired' | 'cancelled';

/** Declaration order is the order the roster's filter offers the statuses in. */
export const CHECK_IN_STATUSES: readonly CheckInStatus[] = [
  'in_progress',
  'reserved',
  'completed',
  'expired',
  'cancelled',
];

/**
 * A student on the current block's list, as the administrator sees them.
 *
 * `checkInClosesAt` is a backend-authoritative instant rather than something derived here: the
 * window's two ends come out of parameters the server owns, and a panel that recomputed them would
 * be a second opinion about when a seat is lost. The frontend only reads the clock against it.
 */
export interface Attendee {
  readonly id: string;
  readonly name: string;
  readonly faculty: string;
  readonly universityId: string;
  readonly status: CheckInStatus;
  /** The code the scanner reads, in the same `UG-1234` shape the student's own QR carries. */
  readonly checkInCode: string;
  /** When the administrator scanned them in, or `null` while they have not arrived. */
  readonly checkedInAt: Date | null;
  /** When their check-in window opens. `null` once the window no longer decides anything. */
  readonly checkInOpensAt: Date | null;
  /** When their check-in window closes. `null` once the window no longer decides anything. */
  readonly checkInClosesAt: Date | null;
}

/**
 * A space the administrator is responsible for, with no block attached. Separate from
 * `CapacityBlock` because "which spaces can I switch to" and "what is happening at 14:00" are two
 * questions: answering the first with a block forces a time to be picked before a space is.
 */
export interface AdminSpace {
  readonly spaceId: string;
  readonly spaceName: string;
  readonly capacity: number;
}

export interface CapacityBlock extends AdminSpace {
  readonly start: Date;
  readonly end: Date;
  readonly attendees: readonly Attendee[];
}

/**
 * What the block's numbers are, derived and never stored: a free seat is the absence of a
 * reservation holding it, not a counter something has to give back (`CLAUDE.md` §22, invariant 1).
 */
export interface BlockOccupancy {
  readonly capacity: number;
  /** Seats a reservation is holding: waiting to check in, or already inside. */
  readonly occupied: number;
  readonly free: number;
  readonly inRoom: number;
  readonly pending: number;
  /** `occupied / capacity`, between 0 and 1, for the meters that draw it. */
  readonly ratio: number;
  /**
   * How many of the block's reservations were actually used — checked in, whether or not the block
   * has ended. The only counters that still say something once every seat has been released.
   */
  readonly attended: number;
  /**
   * How many were lost to the clock. Cancellations are in neither counter on purpose: the student
   * said they were not coming, and `docs/booking-flow.md` §7 rewards exactly that, so counting one
   * as a no-show would report the opposite of what the flow encourages.
   */
  readonly missed: number;
}

export interface AttendeeFilter {
  readonly query: string | null;
  readonly statuses: ReadonlySet<CheckInStatus>;
}
