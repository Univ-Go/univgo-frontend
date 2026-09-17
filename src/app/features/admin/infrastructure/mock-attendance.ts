import { startOfDay, toIsoDate } from '../../../shared/time/calendar-day';
import { BOOKING_DURATION_MINUTES } from '../../spaces/domain/space';
import type { AdminSpace, Attendee, CapacityBlock, CheckInStatus } from '../domain/attendance';

/** Human-readable length: a code the panel prints is read out loud at a desk and typed by hand. */
const CODE_DIGITS = 4;

/**
 * The panel's own stand-in for the identifier a reservation carries. The student's side reads the
 * real one from the server now; this stays until the panel does too.
 */
function createReservationCode(): string {
  const number = Math.floor(Math.random() * 10 ** CODE_DIGITS);

  return `UG-${number.toString().padStart(CODE_DIGITS, '0')}`;
}

const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

/**
 * The fixed block of `docs/booking-flow.md` §2, read from the one place that defines it so the
 * panel's grid and the student's cannot drift apart, and the check-in tolerance around it.
 */
const BLOCK_MINUTES = BOOKING_DURATION_MINUTES;
const CHECK_IN_TOLERANCE_MINUTES = 15;
const BLOCK_HOURS = BLOCK_MINUTES / MINUTES_PER_HOUR;

/** Campus hours, matching the range `closure-form` already offers for a closure's start/end. */
const OPENING_HOUR = 6;
const CLOSING_HOUR = 20;
const BLOCKS_PER_DAY = (CLOSING_HOUR - OPENING_HOUR) / BLOCK_HOURS;

function minutesFrom(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * MS_PER_MINUTE);
}

/**
 * The `hourIndex`-th slot of `day`: 0 is opening time, `BLOCKS_PER_DAY - 1` the last block. Built by
 * setting the hour on a copy of the day rather than by adding milliseconds, so a block keeps its
 * wall-clock time across a daylight-saving transition instead of sliding an hour.
 */
function blockStartAt(day: Date, hourIndex: number): Date {
  const start = startOfDay(day);

  start.setHours(OPENING_HOUR + hourIndex * BLOCK_HOURS, 0, 0, 0);

  return start;
}

/**
 * Which slot contains the current instant, clamped to the campus's open hours: outside them there
 * is no session in progress, and the panel falls back to the day's nearest edge rather than to a
 * slot that would not exist. A real check-in screen would simply say "cerrado"; the mock has no such
 * state to show instead.
 */
function currentBlockIndex(now: Date): number {
  return Math.min(
    BLOCKS_PER_DAY - 1,
    Math.max(0, Math.floor((now.getHours() - OPENING_HOUR) / BLOCK_HOURS)),
  );
}

/** Whole days between two instants, by calendar rather than by division, so a daylight-saving
 *  transition cannot make two adjacent days round to the same offset. */
function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);
}

const FACULTIES = [
  'Ingeniería',
  'Arquitectura',
  'Medicina',
  'Derecho',
  'Ciencias Económicas',
  'Artes',
] as const;

const GIVEN_NAMES = [
  'Carlos',
  'María',
  'Javier',
  'Ana',
  'Luis',
  'Sofía',
  'Diego',
  'Valentina',
  'Andrés',
  'Camila',
  'Mateo',
  'Lucía',
  'Sebastián',
  'Isabella',
  'Nicolás',
  'Daniela',
  'Tomás',
] as const;

const SURNAMES = [
  'Gómez',
  'Rodríguez',
  'López',
  'Martínez',
  'Fernández',
  'Ramírez',
  'Torres',
  'Ruiz',
  'Castro',
  'Herrera',
  'Vargas',
  'Morales',
  'Rojas',
] as const;

/** How many seats a status holds in one sample block, in the order the roster ranks them. */
type RosterShape = readonly (readonly [CheckInStatus, number])[];

/**
 * Everyone already inside arrived somewhere between the tolerance window opening and now. Only a
 * block in progress calls this; a finished one places its arrivals inside its own window instead,
 * since "now" is hours past it and would put every check-in long after the fact.
 */
function arrival(position: number, total: number, start: Date, now: Date): Date {
  const opened = minutesFrom(start, -CHECK_IN_TOLERANCE_MINUTES);
  const elapsed = Math.max(0, now.getTime() - opened.getTime());

  return new Date(opened.getTime() + Math.round((elapsed * position) / Math.max(1, total)));
}

function timesFor(
  status: CheckInStatus,
  position: number,
  total: number,
  start: Date,
  now: Date,
  live: boolean,
): Pick<Attendee, 'checkedInAt' | 'checkInOpensAt' | 'checkInClosesAt'> {
  switch (status) {
    case 'reserved':
      // On the block in progress the deadlines are placed relative to the current instant, so the
      // roster always has somebody about to lose their seat whatever time the panel is opened —
      // which is the state worth looking at. Every other block keeps the window its own start
      // implies, because that is the only honest thing to say about a block nobody is standing in.
      return live
        ? {
            checkedInAt: null,
            checkInOpensAt: minutesFrom(now, -CHECK_IN_TOLERANCE_MINUTES),
            checkInClosesAt: minutesFrom(now, 3 + position * 3),
          }
        : {
            checkedInAt: null,
            checkInOpensAt: minutesFrom(start, -CHECK_IN_TOLERANCE_MINUTES),
            checkInClosesAt: minutesFrom(start, CHECK_IN_TOLERANCE_MINUTES),
          };
    case 'in_progress':
    case 'completed':
      return {
        checkedInAt: live
          ? arrival(position, total, start, now)
          : minutesFrom(
              start,
              -CHECK_IN_TOLERANCE_MINUTES +
                Math.round((2 * CHECK_IN_TOLERANCE_MINUTES * position) / Math.max(1, total)),
            ),
        checkInOpensAt: null,
        checkInClosesAt: null,
      };
    case 'expired':
      // Kept for the scanner: a code scanned after the fact still needs the instant it lapsed to
      // tell "expiró hace un minuto" from "expiró hace una hora".
      return {
        checkedInAt: null,
        checkInOpensAt: null,
        checkInClosesAt: minutesFrom(start, CHECK_IN_TOLERANCE_MINUTES),
      };
    default:
      return { checkedInAt: null, checkInOpensAt: null, checkInClosesAt: null };
  }
}

function buildAttendees(
  roster: RosterShape,
  start: Date,
  now: Date,
  live: boolean,
  seed: number,
): readonly Attendee[] {
  let index = 0;

  return roster.flatMap(([status, count]) =>
    Array.from({ length: count }, (_, position) => {
      const overall = index++;
      // Offset per block as well as per row: without it every block of every day would open with
      // the same name on the first line and the schedule would read as one roster repeated.
      const person = overall + seed;

      return {
        id: `student-${overall + 1}`,
        // Two lists of coprime length, so no pairing repeats before the block is full: two rows
        // with the same name and different faculties read as a bug in the panel, not as a sample.
        name: `${GIVEN_NAMES[person % GIVEN_NAMES.length]} ${SURNAMES[person % SURNAMES.length]}`,
        faculty: FACULTIES[person % FACULTIES.length],
        universityId: `U-${203948 + person * 137}`,
        checkInCode: createReservationCode(),
        status,
        ...timesFor(status, position, count, start, now, live),
      };
    }),
  );
}

/**
 * A slot that has not opened yet only holds reservations — nobody could have checked in. One already
 * over holds none: `CLAUDE.md` §22 invariant 1 says a finished stay is not "given back", it simply
 * stops holding a seat once it resolves.
 *
 * A finished block is split between the students who turned up and the ones the clock took, because
 * a day whose every block read 100 % attendance would be as misleading as one that read none — that
 * gap is half of what the panel exists to show. A block still to come tapers with distance: next
 * Tuesday does not fill the way this afternoon does, and a week of identical days would make the
 * day selector look broken.
 */
function projectedRoster(
  capacity: number,
  hourIndex: number,
  start: Date,
  end: Date,
  now: Date,
): RosterShape {
  const peak = (BLOCKS_PER_DAY - 1) / 2;
  const shape = Math.max(0.15, 1 - Math.abs(hourIndex - peak) / (peak || 1));
  const daysAhead = Math.max(0, daysBetween(now, start));
  const booked = Math.round(capacity * shape * Math.max(0.35, 1 - daysAhead * 0.08));

  if (booked <= 0) {
    return [];
  }

  if (end.getTime() > now.getTime()) {
    return [['reserved', booked]];
  }

  const missed = Math.max(1, Math.round(booked * 0.12));
  const cancelled = Math.round(booked * 0.06);

  return (
    [
      ['completed', Math.max(0, booked - missed - cancelled)],
      ['expired', missed],
      ['cancelled', cancelled],
    ] as RosterShape
  ).filter(([, count]) => count > 0);
}

/**
 * The mix shown for the block in progress right now, as shares of whatever the space actually
 * holds: the spaces are real and their capacities range from a handful to dozens, so a fixed head
 * count would put more people in a room than it has seats.
 */
const LIVE_MIX: readonly (readonly [CheckInStatus, number])[] = [
  ['in_progress', 0.62],
  ['reserved', 0.12],
  ['expired', 0.08],
  ['cancelled', 0.04],
];

function liveRoster(capacity: number): RosterShape {
  return LIVE_MIX.map(([status, share]): readonly [CheckInStatus, number] => [
    status,
    Math.round(capacity * share),
  ]).filter(([, count]) => count > 0);
}

function buildDaySchedule(space: AdminSpace, day: Date, now: Date): readonly CapacityBlock[] {
  const dayOffset = daysBetween(now, day);
  const liveIndex = dayOffset === 0 ? currentBlockIndex(now) : -1;

  return Array.from({ length: BLOCKS_PER_DAY }, (_, hourIndex) => {
    const start = blockStartAt(day, hourIndex);
    const end = minutesFrom(start, BLOCK_MINUTES);
    const live = hourIndex === liveIndex;

    return {
      spaceId: space.spaceId,
      spaceName: space.spaceName,
      capacity: space.capacity,
      start,
      end,
      attendees: buildAttendees(
        live
          ? liveRoster(space.capacity)
          : projectedRoster(space.capacity, hourIndex, start, end, now),
        start,
        now,
        live,
        hourIndex * 7 + dayOffset * 3,
      ),
    };
  });
}

/**
 * Days are built on demand and kept, rather than generated for the whole navigable window up front:
 * that window is two weeks of three spaces of seven blocks, which is thousands of fabricated
 * students for a view that shows seven rows.
 *
 * Holding a day still matters more than the saving, though. `createReservationCode()` is random per
 * call, so regenerating would deal a different roster every time somebody stepped away from a day
 * and came back — a panel that reshuffles under you is not one you can read.
 */
const scheduleCache = new Map<string, readonly CapacityBlock[]>();

/**
 * Every block of `day` for one space, opening to closing. The space is real — it comes from the
 * catalogue — and what is fabricated is who is in it.
 */
export function mockBlocksFor(
  space: AdminSpace,
  day: Date,
  now: Date = new Date(),
): readonly CapacityBlock[] {
  const key = `${space.spaceId}|${toIsoDate(day)}`;
  const cached = scheduleCache.get(key);

  if (cached) {
    return cached;
  }

  const blocks = buildDaySchedule(space, day, now);

  scheduleCache.set(key, blocks);

  return blocks;
}
