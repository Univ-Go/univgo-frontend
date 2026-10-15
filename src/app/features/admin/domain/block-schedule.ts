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

/** A day's total seats across its blocks, for the week grid — per-block detail belongs to a day
 *  already chosen, not to an overview of several of them. */
export interface SpaceDaySummary {
  readonly date: Date;
  readonly totalCapacity: number;
  readonly totalFree: number;
}

/** A day with no schedule reports `totalCapacity` zero, the same way `blocksOf` reports an empty
 *  list for it — it is closed, not full. */
export function isDayOpen(summary: SpaceDaySummary): boolean {
  return summary.totalCapacity > 0;
}

/** What a day still has to offer from `now` on, plus how many blocks that spreads over. */
export interface RemainingDay extends SpaceDaySummary {
  readonly slots: number;
}

/**
 * A day as it can still be booked: a finished block's free seats can no longer be taken and a
 * closed one's never could, so neither counts. A block in progress does, since it is still offered
 * as a last-minute booking (`CLAUDE.md` §22).
 *
 * The server's day summary counts every block, finished ones included, and a finished block reports
 * all its seats free once its reservations stop holding them (invariant 1). For today that would
 * read as an empty day; this is the reading the panel shows instead. A day with nothing left reports
 * zero capacity; `isDayOver` tells whether that is because it finished or because it was closed.
 */
export function remainingDayOf(date: Date, blocks: readonly AdminBlock[], now: Date): RemainingDay {
  const ahead = blocks.filter((block) => !block.closed && blockPhaseOf(block, now) !== 'past');

  return {
    date,
    totalCapacity: ahead.reduce((total, block) => total + Math.max(0, block.capacity), 0),
    totalFree: ahead.reduce((total, block) => total + Math.max(0, block.free), 0),
    slots: ahead.length,
  };
}

/** Whether a day that did open has run through all of its blocks — finished, not closed. */
export function isDayOver(blocks: readonly AdminBlock[], now: Date): boolean {
  const open = blocks.filter((block) => !block.closed);

  return open.length > 0 && open.every((block) => blockPhaseOf(block, now) === 'past');
}

const DAYS_PER_WEEK = 7;
const WEEK_GRID_LENGTH_DAYS = DAYS_PER_WEEK * 2;

/** `Date#getDay()` counts from Sunday; the grid opens on Monday regardless of locale. */
function mondayOffsetOf(date: Date): number {
  return (date.getDay() + 6) % DAYS_PER_WEEK;
}

export function startOfWeek(date: Date): Date {
  return addDays(startOfDay(date), -mondayOffsetOf(date));
}

/**
 * The current week and the next one, Monday through Sunday, as a single span — not "the next 14
 * days", which would start wherever today happens to fall and could open on a Thursday, showing
 * four days of one week and ten of the next instead of two weeks anyone would recognise as such.
 */
export function weekGridRange(now: Date): NavigableDayRange {
  const from = startOfWeek(now);

  return { from, to: addDays(from, WEEK_GRID_LENGTH_DAYS - 1) };
}

export function daysOf(range: NavigableDayRange): readonly Date[] {
  const days: Date[] = [];

  for (let day = range.from; day.getTime() <= range.to.getTime(); day = addDays(day, 1)) {
    days.push(day);
  }

  return days;
}

/**
 * The three bands the desk already groups a day into when talking about it — "la mañana", "la
 * tarde", "la noche" — not a concept the booking flow defines. A block belongs to the band its
 * start hour falls in; a space that opens at six has nothing before the morning boundary, so the
 * boundary never needs to match a space's actual opening hour.
 */
export type BlockShift = 'morning' | 'afternoon' | 'night';

const SHIFT_ORDER: readonly BlockShift[] = ['morning', 'afternoon', 'night'];

const AFTERNOON_START_HOUR = 12;
const NIGHT_START_HOUR = 18;

function shiftOfHour(hour: number): BlockShift {
  if (hour < AFTERNOON_START_HOUR) {
    return 'morning';
  }

  return hour < NIGHT_START_HOUR ? 'afternoon' : 'night';
}

export function blockShiftOf(block: AdminBlock): BlockShift {
  return shiftOfHour(block.start.getHours());
}

/** A shift's blocks, plus the span they actually cover — read from the blocks themselves rather
 *  than from the shift's own boundary, since a space's true opening hours are narrower than it. */
export interface BlockShiftGroup {
  readonly shift: BlockShift;
  readonly blocks: readonly AdminBlock[];
  readonly from: Date;
  readonly to: Date;
}

/** Blocks split by shift, in a fixed morning → afternoon → night order. A shift with nothing
 *  scheduled in it is left out: an empty "Turno noche" tells the reader nothing a shorter list
 *  would not. */
export function groupBlocksByShift(blocks: readonly AdminBlock[]): readonly BlockShiftGroup[] {
  return SHIFT_ORDER.flatMap((shift) => {
    const inShift = blocks.filter((candidate) => blockShiftOf(candidate) === shift);

    if (inShift.length === 0) {
      return [];
    }

    const from = inShift.reduce(
      (earliest, candidate) => (candidate.start < earliest ? candidate.start : earliest),
      inShift[0].start,
    );
    const to = inShift.reduce(
      (latest, candidate) => (candidate.end > latest ? candidate.end : latest),
      inShift[0].end,
    );

    return [{ shift, blocks: inShift, from, to }];
  });
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
