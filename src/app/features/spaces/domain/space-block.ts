/**
 * Why a block cannot be picked. A block that is merely missing from the grid tells the student
 * nothing, and `docs/booking-flow.md` §10 asks for the opposite: a full block is shown as full, and
 * one blocked by a booking the student already has says which.
 */
export type BlockBlocker = 'full' | 'alreadyBooked' | 'overlaps' | 'tooLate';

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
  readonly blocker: BlockBlocker | null;
}

/** What the server states about a block, before it is read as a reason a person can act on. */
export interface BlockVerdict {
  readonly offered: boolean;
  readonly free: number;
  readonly alreadyBookedToday: boolean;
  readonly overlapsAnother: boolean;
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

  if (verdict.alreadyBookedToday) {
    return 'alreadyBooked';
  }

  if (verdict.overlapsAnother) {
    return 'overlaps';
  }

  return verdict.free <= 0 ? 'full' : 'tooLate';
}
