import type { Observable } from 'rxjs';
import type { Space } from './space';
import type { SpaceBlock } from './space-block';

/**
 * Catalogue port. A space is always read for a day, because what the catalogue answers — whether
 * there is room and from what time — is only true of one: `freeSlots` carries that day's bookable
 * blocks and nothing else.
 */
export abstract class SpaceRepository {
  abstract catalog(date: Date): Observable<readonly Space[]>;

  /**
   * Answers `null` for an id that is not in the catalogue, which is a link gone stale, not a fault.
   * `date` is the day the availability fields describe; omitted, it is today — which is all a
   * caller that only wants the space's own facts needs.
   */
  abstract findById(id: string, date?: Date): Observable<Space | null>;

  /**
   * Every block the space runs that day, offered or not, resolved against the student asking: the
   * server is the only one that knows what else they have booked, and a grid that hid the blocks it
   * refuses would read as "the space closes at ten".
   */
  abstract availability(spaceId: string, date: Date): Observable<readonly SpaceBlock[]>;
}
