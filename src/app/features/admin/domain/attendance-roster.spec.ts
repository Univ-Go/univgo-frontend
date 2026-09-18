import type { AdminBlock, Attendee, AttendeeFilter } from './attendance';
import { ROSTER_STATES } from './attendance';
import { blockLoadOf, listAttendees, rosterTallyOf } from './attendance-roster';

const BLOCK_START = new Date(2026, 7, 20, 9, 0);
const BLOCK_END = new Date(2026, 7, 20, 11, 0);

function attendee(overrides: Partial<Attendee> = {}): Attendee {
  return {
    name: 'Carlos Gómez',
    document: '1234567890',
    school: 'Ingeniería',
    state: 'reserved',
    checkedInAt: null,
    ...overrides,
  };
}

function block(overrides: Partial<AdminBlock> = {}): AdminBlock {
  return {
    start: BLOCK_START,
    end: BLOCK_END,
    capacity: 50,
    occupied: 0,
    free: 50,
    closed: false,
    closureReason: null,
    ...overrides,
  };
}

function filter(overrides: Partial<AttendeeFilter> = {}): AttendeeFilter {
  return { query: null, states: new Set(ROSTER_STATES), ...overrides };
}

describe('blockLoadOf', () => {
  it('reports the counts the server gave rather than recounting them', () => {
    expect(blockLoadOf(block({ capacity: 50, occupied: 20, free: 30 }))).toEqual({
      capacity: 50,
      occupied: 20,
      free: 30,
      ratio: 0.4,
    });
  });

  it('leaves the meter empty for a block with no capacity on record', () => {
    expect(blockLoadOf(block({ capacity: 0, occupied: 0, free: 0 })).ratio).toBe(0);
  });

  it('never draws a meter past full, whatever the numbers say', () => {
    expect(blockLoadOf(block({ capacity: 10, occupied: 12, free: 0 })).ratio).toBe(1);
  });
});

describe('rosterTallyOf', () => {
  it('counts who is inside, who is still expected, who used it and who lost it', () => {
    const tally = rosterTallyOf([
      attendee({ state: 'inProgress' }),
      attendee({ state: 'inProgress' }),
      attendee({ state: 'reserved' }),
      attendee({ state: 'finished' }),
      attendee({ state: 'expired' }),
    ]);

    expect(tally).toEqual({ inRoom: 2, pending: 1, attended: 3, missed: 1 });
  });

  it('counts somebody still in the room as having attended, block unfinished or not', () => {
    expect(rosterTallyOf([attendee({ state: 'inProgress' })]).attended).toBe(1);
  });

  it('answers with zeroes for a block nobody booked', () => {
    expect(rosterTallyOf([])).toEqual({ inRoom: 0, pending: 0, attended: 0, missed: 0 });
  });
});

describe('listAttendees', () => {
  it('puts the people still to act on first, then sorts by name', () => {
    const listed = listAttendees(
      [
        attendee({ name: 'Zoe', state: 'finished' }),
        attendee({ name: 'Ana', state: 'inProgress' }),
        attendee({ name: 'Beto', state: 'reserved' }),
      ],
      filter(),
    );

    expect(listed.map((entry) => entry.name)).toEqual(['Beto', 'Ana', 'Zoe']);
  });

  it('drops the states the administrator unticked', () => {
    const listed = listAttendees(
      [attendee({ name: 'Ana', state: 'reserved' }), attendee({ name: 'Zoe', state: 'expired' })],
      filter({ states: new Set(['expired']) }),
    );

    expect(listed.map((entry) => entry.name)).toEqual(['Zoe']);
  });

  it('finds somebody by name or by the document on their card', () => {
    const roster = [
      attendee({ name: 'Ana Ruiz', document: '111' }),
      attendee({ name: 'Beto Díaz', document: '222' }),
    ];

    expect(listAttendees(roster, filter({ query: 'beto' })).map((entry) => entry.document)).toEqual(
      ['222'],
    );
    expect(listAttendees(roster, filter({ query: '111' })).map((entry) => entry.name)).toEqual([
      'Ana Ruiz',
    ]);
  });

  it('does not reorder the list it was given', () => {
    const roster = [attendee({ name: 'Zoe' }), attendee({ name: 'Ana' })];

    listAttendees(roster, filter());

    expect(roster.map((entry) => entry.name)).toEqual(['Zoe', 'Ana']);
  });
});
