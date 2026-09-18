/**
 * A stretch of time a space is not operating, as `docs/booking-flow.md` §12 defines it: maintenance,
 * an incident, an institutional event, a loan to somebody outside.
 *
 * A closure **suspends**: the reservations inside its window keep their place, do not expire and
 * cannot be used, and reverting hands them back. That is what makes it undoable, and it is why
 * clearing a space's reservations stays a separate, explicit action.
 */
export type ClosureReason =
  'maintenance' | 'technical_incident' | 'institutional_event' | 'external_use' | 'other';

/** Declaration order is the order the reason select offers them in. */
export const CLOSURE_REASONS: readonly ClosureReason[] = [
  'maintenance',
  'technical_incident',
  'institutional_event',
  'external_use',
  'other',
];

/**
 * `endsAt` is `null` for a closure with no end date — the shape the panel's "out of service" switch
 * creates, and the honest one for an incident nobody can date the end of yet.
 *
 * `revertedAt` is what ends a closure without erasing it: that a space was shut three times this
 * month and reopened twice is part of what the panel exists to answer.
 */
export interface SpaceClosure {
  readonly id: string;
  readonly spaceId: string;
  readonly startsAt: Date;
  readonly endsAt: Date | null;
  readonly reason: ClosureReason;
  readonly details: string | null;
  readonly createdAt: Date;
  readonly revertedAt: Date | null;
}

/**
 * Where a closure sits relative to the clock, plus the one state the clock does not decide. Derived
 * and never stored, like everything else in this flow: nothing has to flip at the right instant.
 */
export type ClosureStatus = 'scheduled' | 'active' | 'finished' | 'reverted';

export function closureStatusOf(closure: SpaceClosure, now: Date): ClosureStatus {
  if (closure.revertedAt !== null) {
    return 'reverted';
  }

  if (now.getTime() < closure.startsAt.getTime()) {
    return 'scheduled';
  }

  // No end date means it holds until somebody reverts it, so it can never read as finished.
  return closure.endsAt === null || now.getTime() < closure.endsAt.getTime()
    ? 'active'
    : 'finished';
}

/** Only a closure that is still in force can be undone; the rest are history. */
export function isRevertible(closure: SpaceClosure): boolean {
  return closure.revertedAt === null;
}
