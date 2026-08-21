import type { Attendee, CapacityBlock, CheckInStatus } from '../domain/attendance';

const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60_000;

/** The fixed two-hour block of `docs/booking-flow.md` §2, and the check-in tolerance around it. */
const BLOCK_MINUTES = 120;
const CHECK_IN_TOLERANCE_MINUTES = 15;

const NOW = new Date();

/**
 * The block that contains the current hour, so the panel always has a session in progress to show:
 * a fixed calendar date would leave the view describing a morning that ended months ago.
 */
function currentBlockStart(): Date {
  const start = new Date(NOW);
  const blockHours = BLOCK_MINUTES / MINUTES_PER_HOUR;

  start.setHours(start.getHours() - (start.getHours() % blockHours), 0, 0, 0);

  return start;
}

const START = currentBlockStart();

function minutesFrom(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * MS_PER_MINUTE);
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
 * Deadlines are placed relative to the current instant rather than to the block's start: a sample
 * written against the clock has students about to lose their seat whatever time the panel is opened,
 * and one written against the start would show pending reservations whose window closed an hour ago.
 */
function pendingDeadline(position: number): Date {
  return minutesFrom(NOW, 3 + position * 3);
}

/** Everyone already inside arrived somewhere between the tolerance window opening and now. */
function arrival(position: number, total: number): Date {
  const opened = minutesFrom(START, -CHECK_IN_TOLERANCE_MINUTES);
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
  roster: RosterShape,
): CapacityBlock {
  return {
    spaceId,
    spaceName,
    start: START,
    end: minutesFrom(START, BLOCK_MINUTES),
    capacity,
    attendees: buildAttendees(roster),
  };
}

/**
 * Visual mock: the panel's only hardcoded source. It moves behind a domain port once the check-in
 * API exists; nothing outside this file knows the data is fabricated.
 *
 * Three spaces stand in for the ones an administrator would actually be assigned, with different
 * capacities and roster shapes so switching between them is visibly not the same block twice.
 */
export const MOCK_SPACES: readonly CapacityBlock[] = [
  buildBlock('court-basketball-a', 'Cancha de Básquetbol A', 50, [
    ['in_progress', 38],
    ['reserved', 4],
    ['expired', 3],
    ['cancelled', 2],
  ]),
  buildBlock('study-room-b', 'Sala de Estudio Grupal B', 16, [
    ['in_progress', 9],
    ['reserved', 2],
    ['completed', 3],
    ['expired', 1],
  ]),
  buildBlock('field-soccer-c', 'Cancha de Fútbol Sintética C', 22, [
    ['in_progress', 22],
  ]),
];
