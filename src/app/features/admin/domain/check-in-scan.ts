/**
 * The six answers `docs/booking-flow.md` §11 asks the scanner to give, each one unambiguous at a
 * metre's distance with someone waiting: "Válida / Aún no / Expirada / Ya usada / Otro bloque / No
 * existe".
 */
export type ScanOutcome =
  'valid' | 'tooEarly' | 'expired' | 'alreadyUsed' | 'otherBlock' | 'notFound';

/** The block a code does belong to, when the answer is that it is not this one. */
export interface ScanBlockRange {
  readonly startMinutes: number;
  readonly endMinutes: number;
}

/**
 * A discriminated union rather than one shape with optional fields: each verdict carries exactly
 * what its own message needs, and nothing else. The server decides all six — it owns the clock, the
 * tolerance and the write that turns a scan into a check-in — so this type is the shape of its
 * answer, not a second opinion about it.
 *
 * Only the two verdicts about a reservation that is this student's, here and now, carry a name: for
 * the rest the server deliberately says nothing about who the code belongs to. Every instant is
 * optional because a verdict is worth showing even if the detail beside it is missing — above all
 * `valid`, where the check-in has already been written by the time this is read.
 */
export type ScanResult =
  | { readonly outcome: 'valid'; readonly studentName: string; readonly blockEnd: Date | null }
  | { readonly outcome: 'tooEarly'; readonly opensAt: Date | null }
  | { readonly outcome: 'expired'; readonly expiredAt: Date | null }
  | {
      readonly outcome: 'alreadyUsed';
      readonly studentName: string;
      readonly checkedInAt: Date | null;
    }
  | { readonly outcome: 'otherBlock'; readonly range: ScanBlockRange | null }
  | { readonly outcome: 'notFound' };
