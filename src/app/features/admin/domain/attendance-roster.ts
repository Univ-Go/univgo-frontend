import { matchesQuery } from '../../../shared/text/search-text';
import type { Attendee, AttendeeFilter, BlockOccupancy, CapacityBlock } from './attendance';

/**
 * Only these two hold a seat. `completed`, `expired` and `cancelled` all stop counting the moment
 * they happen, which is the whole of "liberar una plaza es una consecuencia, no una acción"
 * (`CLAUDE.md` §22, invariant 1): nothing runs to give the seat back.
 */
const HOLDS_A_SEAT: ReadonlySet<Attendee['status']> = new Set(['reserved', 'in_progress'] as const);

/**
 * How close to its deadline a pending check-in has to be before the panel warns about it. It is a
 * warning threshold and not a rule of the flow: what expires a reservation is the deadline itself.
 */
export const EXPIRY_WARNING_MINUTES = 10;

const MS_PER_MINUTE = 60_000;

/** Ordered so the people the administrator has to act on are the ones at the top of the list. */
const STATUS_RANK: Readonly<Record<Attendee['status'], number>> = {
  reserved: 0,
  in_progress: 1,
  completed: 2,
  expired: 3,
  cancelled: 4,
};

export function occupancyOf(block: CapacityBlock): BlockOccupancy {
  const inRoom = block.attendees.filter((attendee) => attendee.status === 'in_progress').length;
  const pending = block.attendees.filter((attendee) => attendee.status === 'reserved').length;
  const occupied = block.attendees.filter((attendee) => HOLDS_A_SEAT.has(attendee.status)).length;

  return {
    capacity: block.capacity,
    occupied,
    free: Math.max(0, block.capacity - occupied),
    inRoom,
    pending,
    // A block with no capacity on record is not "full": it is unknown, and a full meter would be an
    // assertion nobody made.
    ratio: block.capacity > 0 ? Math.min(1, occupied / block.capacity) : 0,
  };
}

/**
 * How many seats are about to be lost to the clock. Only a reservation still waiting to be scanned
 * can expire — one already in the room cannot — and a deadline that has passed is no longer a
 * warning, it is an outcome the status already carries.
 */
export function countExpiringSoon(block: CapacityBlock, now: Date): number {
  const horizon = now.getTime() + EXPIRY_WARNING_MINUTES * MS_PER_MINUTE;

  return block.attendees.filter(
    (attendee) =>
      attendee.status === 'reserved' &&
      attendee.checkInClosesAt !== null &&
      attendee.checkInClosesAt.getTime() > now.getTime() &&
      attendee.checkInClosesAt.getTime() <= horizon,
  ).length;
}

/**
 * A student is looked for by the two things the person at the desk can read off them or their card:
 * their name and their university id. Which statuses are listed narrows it further — an
 * administrator answering "who still has to come in?" is asking a different question from "who was
 * here today?".
 */
export function listAttendees(
  attendees: readonly Attendee[],
  filter: AttendeeFilter,
): readonly Attendee[] {
  return attendees
    .filter((attendee) => filter.statuses.has(attendee.status))
    .filter((attendee) => matchesQuery(`${attendee.name} ${attendee.universityId}`, filter.query))
    .sort(
      (one, other) =>
        STATUS_RANK[one.status] - STATUS_RANK[other.status] || one.name.localeCompare(other.name),
    );
}
