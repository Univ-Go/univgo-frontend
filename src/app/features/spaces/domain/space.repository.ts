import type { Observable } from 'rxjs';
import type { Space } from './space';

/**
 * Catalogue port. A space is always read for a day, because what the catalogue answers — whether
 * there is room and from what time — is only true of one: `freeSlots` carries that day's bookable
 * blocks and nothing else.
 */
export abstract class SpaceRepository {
  abstract catalog(date: Date): Observable<readonly Space[]>;

  /** Answers `null` for an id that is not in the catalogue, which is a link gone stale, not a fault. */
  abstract findById(id: string): Observable<Space | null>;
}
