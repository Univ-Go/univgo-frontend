import type { Attendee, CapacityBlock } from './attendance';

/**
 * The six answers `docs/booking-flow.md` §11 asks the scanner to give, each one unambiguous at a
 * metre's distance with someone waiting: "Válida / Aún no / Expirada / Ya usada / Otro bloque / No
 * existe".
 */
export type ScanOutcome =
  'valid' | 'tooEarly' | 'expired' | 'alreadyUsed' | 'otherBlock' | 'notFound';

/**
 * A discriminated union rather than one shape with optional fields: `notFound` genuinely has
 * nothing else to show, and every other case always has the attendee and the block their answer is
 * about, so the presentation layer never has to guard against a `null` that a given outcome could
 * not have produced.
 */
export type ScanResult =
  | { readonly outcome: 'valid'; readonly attendee: Attendee; readonly block: CapacityBlock }
  | { readonly outcome: 'tooEarly'; readonly attendee: Attendee; readonly block: CapacityBlock }
  | { readonly outcome: 'expired'; readonly attendee: Attendee; readonly block: CapacityBlock }
  | { readonly outcome: 'alreadyUsed'; readonly attendee: Attendee; readonly block: CapacityBlock }
  | { readonly outcome: 'otherBlock'; readonly attendee: Attendee; readonly block: CapacityBlock }
  | { readonly outcome: 'notFound' };

/** Statuses still worth reporting as "your reservation is elsewhere" rather than as not found. */
const ACTIVE_ELSEWHERE: ReadonlySet<Attendee['status']> = new Set(['reserved', 'in_progress']);

/** Codes are read out loud and typed by hand, so whitespace and case never decide a match. */
function normalize(code: string): string {
  return code.trim().toUpperCase();
}

function findByCode(block: CapacityBlock, code: string): Attendee | undefined {
  return block.attendees.find((attendee) => normalize(attendee.checkInCode) === code);
}

function isSameBlock(a: CapacityBlock, b: CapacityBlock): boolean {
  return a.spaceId === b.spaceId && a.start.getTime() === b.start.getTime();
}

/**
 * Classifies one scanned code against the block the administrator is currently checking people
 * into. A pure function of the current instant, per `docs/booking-flow.md` §13 — no clock of its
 * own, so the six outcomes stay deterministic in tests.
 *
 * Looks in `block` first, and only walks the rest of `schedule` when the code is not there, so a
 * code that matches nowhere near "now" reads as `otherBlock` — the reservation exists, just not
 * here — instead of the flatter `notFound`, which is reserved for a code the system never issued or
 * whose reservation was cancelled.
 */
export function evaluateCheckInScan(
  code: string,
  block: CapacityBlock,
  schedule: readonly CapacityBlock[],
  now: Date,
): ScanResult {
  const normalized = normalize(code);
  const here = findByCode(block, normalized);

  if (here) {
    return evaluateHere(here, block, now);
  }

  const elsewhere = schedule
    .filter((candidate) => !isSameBlock(candidate, block))
    .map((candidate) => ({ attendee: findByCode(candidate, normalized), block: candidate }))
    .find((match) => match.attendee && ACTIVE_ELSEWHERE.has(match.attendee.status));

  if (elsewhere?.attendee) {
    return { outcome: 'otherBlock', attendee: elsewhere.attendee, block: elsewhere.block };
  }

  return { outcome: 'notFound' };
}

function evaluateHere(attendee: Attendee, block: CapacityBlock, now: Date): ScanResult {
  switch (attendee.status) {
    case 'in_progress':
    case 'completed':
      return { outcome: 'alreadyUsed', attendee, block };
    case 'expired':
      return { outcome: 'expired', attendee, block };
    // A cancelled reservation reads exactly like one that never existed: the student cancelled it
    // themselves, and re-surfacing it here would contradict what their own app already told them.
    case 'cancelled':
      return { outcome: 'notFound' };
    case 'reserved':
      return evaluateWindow(attendee, block, now);
  }
}

function evaluateWindow(attendee: Attendee, block: CapacityBlock, now: Date): ScanResult {
  const instant = now.getTime();

  if (attendee.checkInOpensAt && instant < attendee.checkInOpensAt.getTime()) {
    return { outcome: 'tooEarly', attendee, block };
  }

  if (attendee.checkInClosesAt && instant > attendee.checkInClosesAt.getTime()) {
    return { outcome: 'expired', attendee, block };
  }

  return { outcome: 'valid', attendee, block };
}
