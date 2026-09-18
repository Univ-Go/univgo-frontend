import type { Observable } from 'rxjs';
import type { AdminBlock, AdminBlockDetail } from './attendance';

/**
 * The day's blocks, and one of them in full. They are two reads because they cost differently: the
 * list is the space's own counts, and the roster is a name, a document and a school per person. A
 * list that carried every roster would be seven of those to draw seven rows.
 */
export abstract class AdminBlockRepository {
  abstract blocksOf(spaceId: string, date: Date): Observable<readonly AdminBlock[]>;

  /**
   * `null` for a block the space does not run that day — a key carried over from another space, or
   * a day this one does not open — which is an answer rather than a failure.
   */
  abstract blockDetail(
    spaceId: string,
    date: Date,
    start: Date,
  ): Observable<AdminBlockDetail | null>;
}

/**
 * The block a scan is ever checked against (`docs/booking-flow.md` §9): the one the clock is inside
 * of. Outside opening hours there is none, and saying so is better than checking someone into the
 * nearest block they did not book.
 */
export function blockInProgress(blocks: readonly AdminBlock[], now: Date): AdminBlock | undefined {
  return blocks.find(
    (block) => now.getTime() >= block.start.getTime() && now.getTime() < block.end.getTime(),
  );
}
