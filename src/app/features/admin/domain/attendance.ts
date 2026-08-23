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
  /** When the administrator scanned them in, or `null` while they have not arrived. */
  readonly checkedInAt: Date | null;
  /** When their check-in window closes. `null` once the window no longer decides anything. */
  readonly checkInClosesAt: Date | null;
}

export interface CapacityBlock {
  readonly spaceId: string;
  readonly spaceName: string;
  readonly start: Date;
  readonly end: Date;
  readonly capacity: number;
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
}

export interface AttendeeFilter {
  readonly query: string | null;
  readonly statuses: ReadonlySet<CheckInStatus>;
}
