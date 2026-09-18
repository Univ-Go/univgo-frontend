import { matchesQuery } from '../../../shared/text/search-text';
import type { ReservationState } from '../../my-reservations/domain/reservation';
import type { AdminBlock, Attendee, AttendeeFilter, BlockLoad, RosterTally } from './attendance';

/** Ordered so the people the administrator has to act on are the ones at the top of the list. */
const STATE_RANK: Readonly<Record<ReservationState, number>> = {
  reserved: 0,
  inProgress: 1,
  finished: 2,
  expired: 3,
  cancelled: 4,
};

/**
 * The two states that prove a reservation was used. `inProgress` counts as attended rather than as
 * pending an outcome: the student is in the room, and the block merely has not ended yet.
 */
const WAS_USED: ReadonlySet<ReservationState> = new Set(['inProgress', 'finished'] as const);

/**
 * The block's counts as the server gave them, plus the ratio the meters need. Nothing is recounted
 * here: how many seats a block is holding right now is a reading of its clock, not a sum over a
 * list that may not even have been asked for.
 */
export function blockLoadOf(block: AdminBlock): BlockLoad {
  return {
    capacity: block.capacity,
    occupied: block.occupied,
    free: block.free,
    // A block with no capacity on record is not "full": it is unknown, and a full meter would be an
    // assertion nobody made.
    ratio: block.capacity > 0 ? Math.min(1, block.occupied / block.capacity) : 0,
  };
}

/** What the roster says about the same block, which is the half the day's list cannot know. */
export function rosterTallyOf(attendees: readonly Attendee[]): RosterTally {
  return {
    inRoom: attendees.filter((attendee) => attendee.state === 'inProgress').length,
    pending: attendees.filter((attendee) => attendee.state === 'reserved').length,
    attended: attendees.filter((attendee) => WAS_USED.has(attendee.state)).length,
    missed: attendees.filter((attendee) => attendee.state === 'expired').length,
  };
}

/**
 * A student is looked for by the two things the person at the desk can read off them or their card:
 * their name and their document. Which states are listed narrows it further — an administrator
 * answering "who still has to come in?" is asking a different question from "who was here today?".
 */
export function listAttendees(
  attendees: readonly Attendee[],
  filter: AttendeeFilter,
): readonly Attendee[] {
  return attendees
    .filter((attendee) => filter.states.has(attendee.state))
    .filter((attendee) => matchesQuery(`${attendee.name} ${attendee.document}`, filter.query))
    .sort(
      (one, other) =>
        STATE_RANK[one.state] - STATE_RANK[other.state] || one.name.localeCompare(other.name),
    );
}
