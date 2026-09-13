import type { Space } from '../../spaces/domain/space';
import { BOOKING_DURATION_MINUTES } from '../../spaces/domain/space';

/**
 * The grid steps by a whole block, not by an hour, so consecutive blocks meet rather than overlap:
 * `docs/booking-flow.md` §2 says the day's blocks do not overlap and the student chooses among them.
 * Stepping by less would offer 14:00–16:00 and 15:00–17:00 as separate choices for the same seat.
 */
export { BOOKING_DURATION_MINUTES as BOOKING_START_STEP_MINUTES } from '../../spaces/domain/space';

/**
 * What the user has answered so far. Every field is optional because the flow is walked in steps and
 * can be walked backwards: a draft with a space and no time is the normal state between step one and
 * step two, not an error.
 */
export interface BookingDraft {
  readonly space: Space | null;
  readonly date: Date;
  readonly startMinutes: number | null;
}

/** A draft with every question answered, which is the only shape the confirmation step can render. */
export interface ScheduledBooking {
  readonly space: Space;
  readonly date: Date;
  readonly startMinutes: number;
  readonly endMinutes: number;
}

/**
 * The gate the flow is strict about: it decides whether the review step has anything to review, so
 * "can the user move forward" is one rule in the domain rather than a condition repeated by each
 * guard and each button.
 */
export function scheduleBooking(draft: BookingDraft): ScheduledBooking | null {
  if (!draft.space || draft.startMinutes === null) {
    return null;
  }

  return {
    space: draft.space,
    date: draft.date,
    startMinutes: draft.startMinutes,
    endMinutes: draft.startMinutes + BOOKING_DURATION_MINUTES,
  };
}
