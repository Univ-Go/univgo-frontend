import type { Space } from '../../spaces/domain/space';
import type { SpaceBlock } from '../../spaces/domain/space-block';
import { isLastMinute } from '../../spaces/domain/space-block';

/**
 * What the user has answered so far. Every field is optional because the flow is walked in steps and
 * can be walked backwards: a draft with a space and no time is the normal state between step one and
 * step two, not an error.
 */
export interface BookingDraft {
  readonly space: Space | null;
  readonly date: Date;
  readonly block: SpaceBlock | null;
}

/**
 * A draft with every question answered, which is the only shape the confirmation step can render.
 * The hours and the check-in window are the server's own answer about the chosen block, carried
 * through rather than recomputed: `docs/booking-flow.md` §14 puts that clock on the server.
 */
export interface ScheduledBooking {
  readonly space: Space;
  readonly date: Date;
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly checkInClosesAt: Date;
  /** Booking a block that already started, which is what step three has to warn about. */
  readonly lastMinute: boolean;
}

/**
 * The gate the flow is strict about: it decides whether the review step has anything to review, so
 * "can the user move forward" is one rule in the domain rather than a condition repeated by each
 * guard and each button.
 */
export function scheduleBooking(draft: BookingDraft): ScheduledBooking | null {
  if (!draft.space || !draft.block) {
    return null;
  }

  return {
    space: draft.space,
    date: draft.date,
    startMinutes: draft.block.startMinutes,
    endMinutes: draft.block.endMinutes,
    checkInClosesAt: draft.block.checkInClosesAt,
    lastMinute: isLastMinute(draft.block, draft.date),
  };
}
