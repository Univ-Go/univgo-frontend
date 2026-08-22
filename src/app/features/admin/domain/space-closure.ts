/**
 * A planned or already-happened interruption of a space's normal schedule, per `docs/booking-flow.md`
 * §11 ("cancelar reservas del espacio: mantenimiento imprevisto, cierre anticipado o incidencias") and
 * §10 ("el espacio está en mantenimiento: no ofrece bloques; las reservas existentes deben cancelarse
 * desde el panel"). Distinct from `Attendee`/`CapacityBlock`: those describe one block's occupancy,
 * this describes the space itself being taken out of service for a day or a stretch of hours.
 */
export type ClosureScope = 'full_day' | 'time_block' | 'recurring';

/** Declaration order is the order the scope selector offers them in. */
export const CLOSURE_SCOPES: readonly ClosureScope[] = ['full_day', 'time_block', 'recurring'];

export type ClosureReason =
  | 'maintenance'
  | 'technical_incident'
  | 'institutional_event'
  | 'external_use'
  | 'other';

/** Declaration order is the order the reason select offers them in. */
export const CLOSURE_REASONS: readonly ClosureReason[] = [
  'maintenance',
  'technical_incident',
  'institutional_event',
  'external_use',
  'other',
];

/**
 * A `scope: 'recurring'` closure's weekly shape: which weekdays it blocks, the time of day it
 * blocks on each of them, and, optionally, when the arrangement ends. `weekdays` uses
 * `Date#getDay()` values (`0` Sunday … `6` Saturday) so it composes with native `Date` the same way
 * the rest of this domain does. `startTime`/`endTime` carry only a time of day — their date part is
 * not meaningful, the same convention `SpaceClosure.date` uses for the day the arrangement starts.
 * `until: null` is a standing arrangement with no end date — a club's weekly slot, not a temporary
 * block.
 */
export interface ClosureRecurrence {
  readonly weekdays: readonly number[];
  readonly startTime: Date;
  readonly endTime: Date;
  readonly until: Date | null;
}

/**
 * Whether a closure is yet to start, in effect right now, or already over. Three states, not the
 * mockup's four: a day-long closure and an hours-long one that have both already ended are the same
 * outcome for the space, so they share one word instead of two that would mean the same thing.
 */
export type ClosureStatus = 'scheduled' | 'active' | 'completed';

/**
 * `start`/`end` are set only for `scope: 'time_block'`; a full-day closure is defined by `date`
 * alone. For `scope: 'recurring'`, `date` is the day the arrangement takes effect and `recurrence`
 * carries its weekly shape — `start`/`end` stay `null`, since no single date owns a standing weekly
 * block. Either way the period is derived (`closurePeriodOf`), the same way a reservation's status
 * is derived from the clock rather than stored (`CLAUDE.md` §22, invariant 4).
 */
export interface SpaceClosure {
  readonly id: string;
  readonly spaceId: string;
  readonly scope: ClosureScope;
  readonly date: Date;
  readonly start: Date | null;
  readonly end: Date | null;
  readonly recurrence: ClosureRecurrence | null;
  readonly reason: ClosureReason;
  readonly details: string | null;
  readonly authorizedBy: string;
}
