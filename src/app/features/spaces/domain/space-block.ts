import type { ClosureReason } from './closure-reason';

/**
 * Why a block cannot be picked. A block that is merely missing from the grid tells the student
 * nothing, and `docs/booking-flow.md` §10 asks for the opposite: a full block is shown as full, one
 * blocked by a booking the student already has says which, and one in a space that is shut says so
 * with its reason.
 */
export type BlockBlocker = 'closed' | 'full' | 'alreadyBooked' | 'overlaps' | 'tooLate';

/**
 * One two-hour block of a space on a given day, as the server resolved it for this student. Minutes
 * from midnight rather than clock strings, like `SpaceSlot`: comparing and formatting are then
 * arithmetic instead of parsing.
 */
export interface SpaceBlock {
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly capacity: number;
  readonly free: number;
  /**
   * The check-in window this student would get by reserving the block right now, as the server
   * computed it. `docs/booking-flow.md` §5 requires the deadline to be shown *before* confirming,
   * and only the server's clock can state it.
   */
  readonly checkInOpensAt: Date;
  readonly checkInClosesAt: Date;
  readonly blocker: BlockBlocker | null;
  /** Set exactly when the blocker is `closed`, which is the only case that has a reason to give. */
  readonly closureReason: ClosureReason | null;
}

/**
 * Whether taking this block would be a last-minute booking — one made after the block already
 * started, which buys less time and a check-in window that closes sooner
 * (`docs/booking-flow.md` §9).
 *
 * Read from the server's own answer rather than from the browser's clock: check-in opens at
 * `max(start − tolerance, creation)`, so a window that opens *after* the block began can only mean
 * the block began first.
 */
export function isLastMinute(block: SpaceBlock, date: Date): boolean {
  const start = new Date(date);

  start.setHours(0, block.startMinutes, 0, 0);

  return block.checkInOpensAt.getTime() > start.getTime();
}

/** What the server states about a block, before it is read as a reason a person can act on. */
export interface BlockVerdict {
  readonly offered: boolean;
  readonly free: number;
  readonly alreadyBookedToday: boolean;
  readonly overlapsAnother: boolean;
  readonly closed: boolean;
}

/**
 * The order is what the student can do something about, not what the server checked first: having
 * already booked this space today blocks every block of it, so saying "completo" about one of them
 * would send someone to wait for a plaza that would not help them anyway.
 *
 * Nothing left to explain means the block's time has passed — `docs/booking-flow.md` §4: a block
 * stops being offered once too little of it remains to be worth using.
 */
export function blockerOf(verdict: BlockVerdict): BlockBlocker | null {
  if (verdict.offered) {
    return null;
  }

  // First because it is the one the student can do nothing about, and because every other reading
  // would be a lie: a shut space is not full, and its hours have not passed.
  if (verdict.closed) {
    return 'closed';
  }

  if (verdict.alreadyBookedToday) {
    return 'alreadyBooked';
  }

  if (verdict.overlapsAnother) {
    return 'overlaps';
  }

  return verdict.free <= 0 ? 'full' : 'tooLate';
}
