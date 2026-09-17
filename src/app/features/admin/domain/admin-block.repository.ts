import type { Observable } from 'rxjs';
import { minutesOfDay } from '../../../shared/time/time-of-day';

/**
 * One block of a space on a given day, as the panel reads it: the numbers and nothing else. Who is
 * in it is the block detail's answer, and asking for it here would make a list of seven rows a list
 * of seven rosters.
 */
export interface AdminBlock {
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly capacity: number;
  /** Seats a reservation is holding: waiting to check in, or already inside. */
  readonly occupied: number;
  readonly free: number;
}

export abstract class AdminBlockRepository {
  abstract blocksOf(spaceId: string, date: Date): Observable<readonly AdminBlock[]>;
}

/**
 * The block a scan is ever checked against (`docs/booking-flow.md` §9): the one the clock is inside
 * of. Outside opening hours there is none, and saying so is better than checking someone into the
 * nearest block they did not book.
 */
export function blockInProgress(blocks: readonly AdminBlock[], now: Date): AdminBlock | undefined {
  const minutes = minutesOfDay(now);

  return blocks.find((block) => minutes >= block.startMinutes && minutes < block.endMinutes);
}
