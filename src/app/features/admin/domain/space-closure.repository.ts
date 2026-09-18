import type { Observable } from 'rxjs';
import type { ClosureReason, SpaceClosure } from './space-closure';

/**
 * What the panel registers when a space stops operating. `endsAt` null is a closure with no end
 * date, which is the honest shape for an incident nobody can date the end of yet — and the one the
 * "out of service" switch creates.
 */
export interface ClosureRequest {
  readonly startsAt: Date;
  readonly endsAt: Date | null;
  readonly reason: ClosureReason;
  readonly details: string | null;
}

export abstract class SpaceClosureRepository {
  /** The whole history of a space, reverted closures included. */
  abstract closuresOf(spaceId: string): Observable<readonly SpaceClosure[]>;

  abstract close(spaceId: string, request: ClosureRequest): Observable<SpaceClosure>;

  /**
   * Reopens the space. Nothing has to be restored: the reservations it suspended were never
   * touched, so they read as reserved again the moment the closure stops being in force.
   */
  abstract revert(spaceId: string, closureId: string): Observable<SpaceClosure>;
}
