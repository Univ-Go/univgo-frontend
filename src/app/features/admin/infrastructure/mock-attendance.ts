import type { Attendee, CapacityBlock, CheckInStatus } from '../domain/attendance';

const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60_000;

/** The fixed two-hour block of `docs/booking-flow.md` §2, and the check-in tolerance around it. */
const BLOCK_MINUTES = 120;
const CHECK_IN_TOLERANCE_MINUTES = 15;
const BLOCK_HOURS = BLOCK_MINUTES / MINUTES_PER_HOUR;

/** Campus hours, matching the range `closure-form` already offers for a closure's start/end. */
const OPENING_HOUR = 6;
const CLOSING_HOUR = 20;
const BLOCKS_PER_DAY = (CLOSING_HOUR - OPENING_HOUR) / BLOCK_HOURS;

const NOW = new Date();

function minutesFrom(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * MS_PER_MINUTE);
}

/** The grid's `hourIndex`-th slot, today: 0 is opening time, `BLOCKS_PER_DAY - 1` the last block. */
function blockStartAt(hourIndex: number): Date {
  const start = new Date(NOW);

  start.setHours(OPENING_HOUR + hourIndex * BLOCK_HOURS, 0, 0, 0);

  return start;
}

/**
 * Which slot contains the current instant, clamped to the campus's open hours: outside them there
 * is no session in progress, and the panel falls back to the day's nearest edge rather than to a
 * slot that would not exist. A real check-in screen would simply say "cerrado"; the mock has no such
 * state to show instead.
 */
const CURRENT_BLOCK_INDEX = Math.min(
  BLOCKS_PER_DAY - 1,
  Math.max(0, Math.floor((NOW.getHours() - OPENING_HOUR) / BLOCK_HOURS)),
);

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
 * Deadlines are placed relative to the current instant rather than to the block's start: a sample
 * written against the clock has students about to lose their seat whatever time the panel is opened,
 * and one written against the start would show pending reservations whose window closed an hour ago.
 */
function pendingDeadline(position: number): Date {
  return minutesFrom(NOW, 3 + position * 3);
}

/**
 * Everyone already inside arrived somewhere between the tolerance window opening and now. Only the
 * block in progress right now ever calls this, so "the block's start" is unambiguous here.
 */
function arrival(position: number, total: number): Date {
  const opened = minutesFrom(blockStartAt(CURRENT_BLOCK_INDEX), -CHECK_IN_TOLERANCE_MINUTES);
  const elapsed = NOW.getTime() - opened.getTime();

  return new Date(opened.getTime() + Math.round((elapsed * position) / Math.max(1, total)));
}

function timesFor(
  status: CheckInStatus,
  position: number,
  total: number,
): Pick<Attendee, 'checkedInAt' | 'checkInClosesAt'> {
  switch (status) {
    case 'reserved':
      return { checkedInAt: null, checkInClosesAt: pendingDeadline(position) };
    case 'in_progress':
    case 'completed':
      return { checkedInAt: arrival(position, total), checkInClosesAt: null };
    default:
      return { checkedInAt: null, checkInClosesAt: null };
  }
}

function buildAttendees(roster: RosterShape): readonly Attendee[] {
  let index = 0;

  return roster.flatMap(([status, count]) =>
    Array.from({ length: count }, (_, position) => {
      const overall = index++;

      return {
        id: `student-${overall + 1}`,
        // Two lists of coprime length, so no pairing repeats before the block is full: two rows
        // with the same name and different faculties read as a bug in the panel, not as a sample.
        name: `${GIVEN_NAMES[overall % GIVEN_NAMES.length]} ${SURNAMES[overall % SURNAMES.length]}`,
        faculty: FACULTIES[overall % FACULTIES.length],
        universityId: `U-${203948 + overall * 137}`,
        status,
        ...timesFor(status, position, count),
      };
    }),
  );
}

function buildBlock(
  spaceId: string,
  spaceName: string,
  capacity: number,
  start: Date,
  roster: RosterShape,
): CapacityBlock {
  return {
    spaceId,
    spaceName,
    start,
    end: minutesFrom(start, BLOCK_MINUTES),
    capacity,
    attendees: buildAttendees(roster),
  };
}

/**
 * A slot that has not opened yet only holds reservations — nobody could have checked in. One
 * already over holds none: `CLAUDE.md` §22 invariant 1 says a finished stay is not "given back", it
 * simply stops holding a seat once it resolves. Only the block in progress right now gets the
 * hand-written mix of statuses that makes a roster worth looking at; every other slot is a single
 * projected count, heavier around midday, the way a campus actually fills up.
 */
function projectedRoster(capacity: number, hourIndex: number, end: Date): RosterShape {
  const peak = (BLOCKS_PER_DAY - 1) / 2;
  const fill = Math.max(0.15, 1 - Math.abs(hourIndex - peak) / (peak || 1));
  const count = Math.round(capacity * fill);
  const status: CheckInStatus = end.getTime() <= NOW.getTime() ? 'completed' : 'reserved';

  return [[status, count]];
}

interface SpaceSpec {
  readonly spaceId: string;
  readonly spaceName: string;
  readonly capacity: number;
  /** The mix shown for the block in progress right now; every other slot is projected. */
  readonly currentRoster: RosterShape;
}

/**
 * Three spaces stand in for the ones an administrator would actually be assigned, with different
 * capacities and roster shapes so switching between them is visibly not the same block twice.
 */
const SPACE_SPECS: readonly SpaceSpec[] = [
  {
    spaceId: 'court-basketball-a',
    spaceName: 'Cancha de Básquetbol A',
    capacity: 50,
    currentRoster: [
      ['in_progress', 38],
      ['reserved', 4],
      ['expired', 3],
      ['cancelled', 2],
    ],
  },
  {
    spaceId: 'study-room-b',
    spaceName: 'Sala de Estudio Grupal B',
    capacity: 16,
    currentRoster: [
      ['in_progress', 9],
      ['reserved', 2],
      ['completed', 3],
      ['expired', 1],
    ],
  },
  {
    spaceId: 'field-soccer-c',
    spaceName: 'Cancha de Fútbol Sintética C',
    capacity: 22,
    currentRoster: [['in_progress', 22]],
  },
];

function buildDaySchedule(spec: SpaceSpec): readonly CapacityBlock[] {
  return Array.from({ length: BLOCKS_PER_DAY }, (_, hourIndex) => {
    const start = blockStartAt(hourIndex);
    const roster =
      hourIndex === CURRENT_BLOCK_INDEX
        ? spec.currentRoster
        : projectedRoster(spec.capacity, hourIndex, minutesFrom(start, BLOCK_MINUTES));

    return buildBlock(spec.spaceId, spec.spaceName, spec.capacity, start, roster);
  });
}

/**
 * Visual mock: the panel's only hardcoded source. It moves behind a domain port once the check-in
 * API exists; nothing outside this file knows the data is fabricated.
 *
 * Every space's full day, so "consultar otros bloques" (`docs/booking-flow.md` §11) has something to
 * browse. Grouped by space, `BLOCKS_PER_DAY` slots each, in opening-to-closing order.
 */
export const MOCK_SPACE_SCHEDULE: readonly CapacityBlock[] = SPACE_SPECS.flatMap(buildDaySchedule);

/** One block per space — the one in progress right now — for pickers that only need a space's
 *  identity, not its whole day. */
export const MOCK_SPACES: readonly CapacityBlock[] = MOCK_SPACE_SCHEDULE.filter(
  (_, index) => index % BLOCKS_PER_DAY === CURRENT_BLOCK_INDEX,
);
