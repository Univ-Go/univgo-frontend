import type { ReservationState } from '../../my-reservations/domain/reservation';
import type { ClosureReason } from '../../spaces/domain/closure-reason';

/**
 * The states a block's roster can hold. The server lists the reservations that still count for the
 * block, so a booking the student gave up never appears here — it is not a filter the panel forgot,
 * it is that a cancelled reservation stopped being part of this block the moment it was cancelled
 * (`CLAUDE.md` §22, invariant 1).
 *
 * Declaration order is the order the roster's filter offers them in.
 */
export const ROSTER_STATES = [
  'reserved',
  'inProgress',
  'finished',
  'expired',
  'suspended',
] as const satisfies readonly ReservationState[];

export type RosterState = (typeof ROSTER_STATES)[number];

/**
 * A student on the current block's list, as the administrator sees them: who they are, what they
 * can show at the desk, and whether they are already inside.
 *
 * The document and the school are what the person at the door checks a face against — the same
 * vocabulary the student's card carries. There is no check-in code here on purpose: a code is
 * scanned, never read off a list, and the scanner is where a check-in happens.
 */
export interface Attendee {
  readonly name: string;
  readonly document: string;
  readonly school: string;
  readonly state: ReservationState;
  /** When the administrator scanned them in, or `null` while they have not arrived. */
  readonly checkedInAt: Date | null;
}

/**
 * A space the administrator is responsible for, with no block attached. Separate from `AdminBlock`
 * because "which spaces can I switch to" and "what is happening at 14:00" are two questions:
 * answering the first with a block forces a time to be picked before a space is.
 */
export interface AdminSpace {
  readonly spaceId: string;
  readonly spaceName: string;
  readonly capacity: number;
  /** Out of service: it offers no blocks, and the panel is where that is turned on and off. */
  readonly underMaintenance: boolean;
}

/**
 * One block of a space on one day, with the numbers the server counted. `occupied` and `free` are
 * its answer and not a sum made here: a free seat is the absence of a reservation holding it at
 * this instant, which only the server's clock can settle.
 *
 * `start` and `end` are instants on the day that was asked for, so everything that reads a block —
 * its phase, its key in the URL, the switcher — compares dates rather than parsing clock strings.
 */
export interface AdminBlock {
  readonly start: Date;
  readonly end: Date;
  readonly capacity: number;
  /** Seats a reservation is holding: waiting to check in, or already inside. */
  readonly occupied: number;
  readonly free: number;
  /** The space is shut for this block, so its counts say nothing anybody can use (spec §12). */
  readonly closed: boolean;
  /** Set exactly when `closed` is, because that is the only case with a reason to give. */
  readonly closureReason: ClosureReason | null;
}

/** One block with the people in it, which is the only reading that costs a request of its own. */
export interface AdminBlockDetail extends AdminBlock {
  readonly attendees: readonly Attendee[];
}

/** How full a block is. Everything here is the server's count, plus the ratio the meters draw. */
export interface BlockLoad {
  readonly capacity: number;
  readonly occupied: number;
  readonly free: number;
  /** `occupied / capacity`, between 0 and 1. */
  readonly ratio: number;
}

/**
 * What the roster adds to the count: the same people, read by what they did rather than by whether
 * they hold a seat. Only the block detail can answer it, which is why it is not part of `BlockLoad`
 * — the day's list knows how full each block is and nothing about who turned up.
 */
export interface RosterTally {
  readonly inRoom: number;
  readonly pending: number;
  /**
   * How many of the block's reservations were used — checked in, whether or not the block has
   * ended. The only counter that still says something once every seat has been released.
   */
  readonly attended: number;
  /**
   * How many were lost to the clock. Cancellations are in neither counter, and cannot be: the
   * server does not list them, because the student said they were not coming and
   * `docs/booking-flow.md` §7 rewards exactly that.
   */
  readonly missed: number;
}

export interface AttendeeFilter {
  readonly query: string | null;
  readonly states: ReadonlySet<ReservationState>;
}
