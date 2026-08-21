import type { Attendee, AttendeeFilter, CapacityBlock, CheckInStatus } from './attendance';
import { CHECK_IN_STATUSES } from './attendance';
import {
  EXPIRY_WARNING_MINUTES,
  countExpiringSoon,
  listAttendees,
  occupancyOf,
} from './attendance-roster';

const BLOCK_START = new Date(2026, 7, 20, 9, 0);
const BLOCK_END = new Date(2026, 7, 20, 11, 0);

const MS_PER_MINUTE = 60_000;

function minutesFrom(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * MS_PER_MINUTE);
}

function attendee(overrides: Partial<Attendee> = {}): Attendee {
  return {
    id: 'student-1',
    name: 'Carlos Gómez',
    faculty: 'Ingeniería',
    universityId: 'U-203948',
    status: 'reserved',
    checkedInAt: null,
    checkInClosesAt: minutesFrom(BLOCK_START, 15),
    ...overrides,
  };
}

function block(attendees: readonly Attendee[], capacity = 50): CapacityBlock {
  return {
    spaceId: 'court-basketball-a',
    spaceName: 'Cancha de Básquetbol A',
    start: BLOCK_START,
    end: BLOCK_END,
    capacity,
    attendees,
  };
}

function filter(overrides: Partial<AttendeeFilter> = {}): AttendeeFilter {
  return {
    query: null,
    statuses: new Set(CHECK_IN_STATUSES),
    ...overrides,
  };
}

function withStatus(status: CheckInStatus, id: string): Attendee {
  return attendee({ id, status });
}

describe('occupancyOf', () => {
  it('counts a seat as taken while a reservation is waiting or already inside', () => {
    const occupancy = occupancyOf(
      block([withStatus('reserved', 'a'), withStatus('in_progress', 'b')], 10),
    );

    expect(occupancy.pending).toBe(1);
    expect(occupancy.inRoom).toBe(1);
    expect(occupancy.occupied).toBe(2);
    expect(occupancy.free).toBe(8);
  });

  it('frees the seat of a reservation that ended, expired or was cancelled', () => {
    const occupancy = occupancyOf(
      block(
        [
          withStatus('in_progress', 'a'),
          withStatus('completed', 'b'),
          withStatus('expired', 'c'),
          withStatus('cancelled', 'd'),
        ],
        10,
      ),
    );

    expect(occupancy.occupied).toBe(1);
    expect(occupancy.free).toBe(9);
  });

  it('reports how full the block is as a fraction of its capacity', () => {
    const attendees = Array.from({ length: 42 }, (_, index) =>
      withStatus('in_progress', `student-${index}`),
    );

    expect(occupancyOf(block(attendees, 50)).ratio).toBeCloseTo(0.84);
  });

  it('never reports a negative number of free seats when a block is overbooked', () => {
    const attendees = Array.from({ length: 4 }, (_, index) =>
      withStatus('reserved', `student-${index}`),
    );

    const occupancy = occupancyOf(block(attendees, 2));

    expect(occupancy.free).toBe(0);
    expect(occupancy.ratio).toBe(1);
  });

  it('does not report a block of unknown capacity as full', () => {
    expect(occupancyOf(block([withStatus('reserved', 'a')], 0)).ratio).toBe(0);
  });
});

describe('countExpiringSoon', () => {
  const now = new Date(2026, 7, 20, 9, 10);

  it('counts the reservations whose check-in window closes within the warning window', () => {
    const counted = countExpiringSoon(
      block([
        attendee({ id: 'a', checkInClosesAt: minutesFrom(now, 1) }),
        attendee({ id: 'b', checkInClosesAt: minutesFrom(now, EXPIRY_WARNING_MINUTES) }),
      ]),
      now,
    );

    expect(counted).toBe(2);
  });

  it('ignores a window that closes further away than the warning window', () => {
    const counted = countExpiringSoon(
      block([attendee({ id: 'a', checkInClosesAt: minutesFrom(now, EXPIRY_WARNING_MINUTES + 1) })]),
      now,
    );

    expect(counted).toBe(0);
  });

  it('ignores a window that has already closed, because that is an outcome and not a warning', () => {
    const counted = countExpiringSoon(
      block([attendee({ id: 'a', checkInClosesAt: minutesFrom(now, -1) })]),
      now,
    );

    expect(counted).toBe(0);
  });

  it('ignores anyone who is no longer waiting to be scanned', () => {
    const counted = countExpiringSoon(
      block([
        attendee({ id: 'a', status: 'in_progress', checkInClosesAt: minutesFrom(now, 1) }),
        attendee({ id: 'b', status: 'expired', checkInClosesAt: minutesFrom(now, 1) }),
      ]),
      now,
    );

    expect(counted).toBe(0);
  });
});

describe('listAttendees', () => {
  it('puts the students still waiting to be scanned first', () => {
    const listed = listAttendees(
      [
        withStatus('cancelled', 'a'),
        withStatus('in_progress', 'b'),
        withStatus('reserved', 'c'),
        withStatus('expired', 'd'),
      ],
      filter(),
    );

    expect(listed.map((entry) => entry.id)).toEqual(['c', 'b', 'd', 'a']);
  });

  it('finds a student by name, ignoring accents', () => {
    const listed = listAttendees(
      [attendee({ id: 'a', name: 'María Rodríguez' }), attendee({ id: 'b', name: 'Javier López' })],
      filter({ query: 'maria' }),
    );

    expect(listed.map((entry) => entry.id)).toEqual(['a']);
  });

  it('finds a student by university id', () => {
    const listed = listAttendees(
      [
        attendee({ id: 'a', universityId: 'U-203948' }),
        attendee({ id: 'b', universityId: 'U-192837' }),
      ],
      filter({ query: 'u-192837' }),
    );

    expect(listed.map((entry) => entry.id)).toEqual(['b']);
  });

  it('keeps only the statuses that were asked for', () => {
    const listed = listAttendees(
      [withStatus('reserved', 'a'), withStatus('expired', 'b')],
      filter({ statuses: new Set<CheckInStatus>(['expired']) }),
    );

    expect(listed.map((entry) => entry.id)).toEqual(['b']);
  });

  it('comes back empty when no status is left to list', () => {
    expect(
      listAttendees([withStatus('reserved', 'a')], filter({ statuses: new Set<CheckInStatus>() })),
    ).toEqual([]);
  });
});
