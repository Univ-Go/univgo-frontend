import { addDays, startOfDay } from '../../../shared/time/calendar-day';
import type { AdminBlock, BlockLoad } from './attendance';

/**
 * Where a block sits relative to the clock. It is derived per block and never per day: at three in
 * the afternoon today's six o'clock block is over and its six in the evening one has not opened, so
 * a day-wide phase would make the list assert things it cannot know. The day-level reading falls
 * out of this one — every block of a future day is `upcoming` — but not the other way round.
 *
 * Half-open, like every other window in the flow: the instant a block starts it is `live`, and the
 * instant it ends it is `past`, so no block is ever in two phases at once.
 */
export type BlockPhase = 'upcoming' | 'live' | 'past';

export function blockPhaseOf(block: AdminBlock, now: Date): BlockPhase {
  if (now.getTime() < block.start.getTime()) {
    return 'upcoming';
  }

  return now.getTime() < block.end.getTime() ? 'live' : 'past';
}

/**
 * Where a block sits on the way to being full. Two thresholds, not a rule of the flow: what stops a
 * booking is the seat count, and these only decide how loudly the row says so — the same standing
 * `EXPIRY_WARNING_MINUTES` has beside it.
 *
 * They are shared by the meter's colour and by the badge's wording on purpose. A bar that turned
 * while the pill still read "Disponible" would be two answers to one question.
 */
export const HIGH_LOAD_RATIO = 0.75;
export const CRITICAL_LOAD_RATIO = 0.9;

export type OccupancyLoad = 'low' | 'high' | 'critical';

export function occupancyLoadOf(occupancy: BlockLoad): OccupancyLoad {
  // A block with no capacity on record is unknown, not saturated — the same call `occupancyOf` makes
  // when it refuses to draw a full meter for a capacity nobody stated.
  if (occupancy.capacity <= 0) {
    return 'low';
  }

  if (occupancy.ratio >= CRITICAL_LOAD_RATIO) {
    return 'critical';
  }

  return occupancy.ratio >= HIGH_LOAD_RATIO ? 'high' : 'low';
}

/** How full a block is, as the three answers the desk actually gives to "¿queda sitio?". */
export type FullnessBand = 'available' | 'nearlyFull' | 'full';

export function fullnessBandOf(occupancy: BlockLoad): FullnessBand {
  if (occupancy.capacity <= 0) {
    return 'available';
  }

  if (occupancy.free <= 0) {
    return 'full';
  }

  return occupancy.ratio >= HIGH_LOAD_RATIO ? 'nearlyFull' : 'available';
}

/** The days the panel will open, inclusive, both at the start of their day. */
export interface NavigableDayRange {
  readonly from: Date;
  readonly to: Date;
}

/**
 * The window around today the panel can be pointed at. Bounded because the panel is a desk tool and
 * not a historical report: an endless calendar would promise days nobody consults and that the view
 * has no reason to hold. Both numbers come from `APP_CONFIG` (`docs/booking-flow.md` §3).
 */
export function navigableDayRange(
  now: Date,
  historyDays: number,
  planningDays: number,
): NavigableDayRange {
  const today = startOfDay(now);

  return {
    from: addDays(today, -Math.max(0, historyDays)),
    to: addDays(today, Math.max(0, planningDays)),
  };
}

export function isWithinNavigableRange(day: Date, range: NavigableDayRange): boolean {
  const candidate = startOfDay(day).getTime();

  return candidate >= range.from.getTime() && candidate <= range.to.getTime();
}

/** A day outside the window lands on the nearest bound rather than nowhere: a hand-edited or stale
 *  address should open the closest thing the panel can show, not an error page. */
export function clampToNavigableRange(day: Date, range: NavigableDayRange): Date {
  const candidate = startOfDay(day);

  if (candidate.getTime() < range.from.getTime()) {
    return range.from;
  }

  return candidate.getTime() > range.to.getTime() ? range.to : candidate;
}

const BLOCK_KEY = /^(\d{2})-(\d{2})$/;

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;

/**
 * A block's address inside its day, as `HH-mm`. The composite `(spaceId, start-epoch-ms)` the rest
 * of the panel compares blocks by is exact but unreadable and shifts with the timezone, so it is not
 * something to put in a URL somebody types, reads back or sends to a colleague. The day travels
 * separately, which is what lets this be two numbers.
 *
 * `-` and not `:` because a colon in a path segment is legal but is escaped inconsistently between
 * `routerLink`'s array and string forms.
 */
export function blockKeyOf(block: AdminBlock): string {
  const hours = String(block.start.getHours()).padStart(2, '0');
  const minutes = String(block.start.getMinutes()).padStart(2, '0');

  return `${hours}-${minutes}`;
}

export function parseBlockKey(
  key: string | null | undefined,
): { hours: number; minutes: number } | null {
  const match = BLOCK_KEY.exec(key ?? '');

  if (match === null) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  return hours < HOURS_PER_DAY && minutes < MINUTES_PER_HOUR ? { hours, minutes } : null;
}

/**
 * `undefined` rather than a fallback block when nothing matches: spaces keep their own opening
 * hours, so a key carried over from another space — or from a day this one does not open — names a
 * block that genuinely is not there, and silently showing a different one would be worse than
 * saying so.
 */
export function findBlockByKey(
  blocks: readonly AdminBlock[],
  key: string | null | undefined,
): AdminBlock | undefined {
  const parsed = parseBlockKey(key);

  if (parsed === null) {
    return undefined;
  }

  return blocks.find(
    (block) =>
      block.start.getHours() === parsed.hours && block.start.getMinutes() === parsed.minutes,
  );
}
