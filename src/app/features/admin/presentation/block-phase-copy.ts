import type { BlockPhase } from '../domain/block-schedule';

/**
 * What a block's numbers are called, per phase. The three readings are not three styles of the same
 * sentence: a block still to come can only report what has been booked, one in progress reports who
 * is in the room, and one that is over reports who turned up. Saying "aforo" over a finished block
 * would be asserting a seat count that stopped meaning anything when it ended.
 *
 * A `Record` over the domain's own union, so a phase added there breaks the build here until it has
 * a label — the same standing `CLOSURE_REASON_OPTIONS` has beside it.
 */
export const BLOCK_PHASE_LABELS: Readonly<Record<BlockPhase, string>> = {
  upcoming: $localize`:@@admin.blocks.capacity.upcoming:Aforo previsto`,
  live: $localize`:@@admin.blocks.capacity.live:Aforo actual`,
  past: $localize`:@@admin.blocks.capacity.past:Asistencia`,
};
