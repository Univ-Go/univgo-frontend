/**
 * Why a space is not operating (`docs/booking-flow.md` §12). It lives with the space and not with
 * the panel that registers it because both sides of the product read it: the administrator picks
 * one, and the student sees it on the block they cannot take.
 */
export type ClosureReason =
  'maintenance' | 'technical_incident' | 'institutional_event' | 'external_use' | 'other';

/** Declaration order is the order the panel's reason select offers them in. */
export const CLOSURE_REASONS: readonly ClosureReason[] = [
  'maintenance',
  'technical_incident',
  'institutional_event',
  'external_use',
  'other',
];

/**
 * The backend names them in upper case. Translating here keeps that spelling out of every view, and
 * an unknown one lands in the widest bucket rather than hiding why a block is shut.
 */
export function closureReasonFromName(name: string): ClosureReason {
  const reason = name.toLowerCase() as ClosureReason;

  return CLOSURE_REASONS.includes(reason) ? reason : 'other';
}
