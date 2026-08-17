import type { Space, SpaceCategory, SpaceFilter, SpaceSlot } from './space';
import { groupByCategory, isFilterActive, listSpaces, resolveAvailability } from './space-catalog';

const MONDAY = new Date(2026, 7, 17);
const TUESDAY = new Date(2026, 7, 18);

function at(hour: number, minute = 0): number {
  return hour * 60 + minute;
}

function slot(date: Date, from: number, to: number): SpaceSlot {
  return { date, from: at(from), to: at(to) };
}

function space(overrides: Partial<Space> = {}): Space {
  return {
    id: 'court-a',
    name: 'Cancha A',
    location: 'Complejo Deportivo',
    category: 'sports',
    capacity: 20,
    underMaintenance: false,
    freeSlots: [slot(MONDAY, 8, 12), slot(MONDAY, 15, 18)],
    ...overrides,
  };
}

function filter(overrides: Partial<SpaceFilter> = {}): SpaceFilter {
  return { category: null, date: MONDAY, from: null, to: null, ...overrides };
}

describe('resolveAvailability', () => {
  it('reports maintenance regardless of the free slots on record', () => {
    const underMaintenance = space({ underMaintenance: true });

    expect(resolveAvailability(underMaintenance, filter())).toEqual({ kind: 'maintenance' });
  });

  it('reports the earliest slot of the day when no start time is requested', () => {
    expect(resolveAvailability(space(), filter())).toEqual({
      kind: 'free',
      slot: slot(MONDAY, 8, 12),
    });
  });

  it('reports unavailable when the space has no slot on the requested day', () => {
    expect(resolveAvailability(space(), filter({ date: TUESDAY }))).toEqual({
      kind: 'unavailable',
    });
  });

  it('reports free when one slot covers the whole requested window', () => {
    const availability = resolveAvailability(space(), filter({ from: at(9), to: at(11) }));

    expect(availability).toEqual({ kind: 'free', slot: slot(MONDAY, 8, 12) });
  });

  it('reports the next slot when the requested window spills past the end of a slot', () => {
    const availability = resolveAvailability(space(), filter({ from: at(11), to: at(13) }));

    expect(availability).toEqual({ kind: 'later', slot: slot(MONDAY, 15, 18) });
  });

  it('does not stitch two consecutive slots into one bookable window', () => {
    const consecutive = space({ freeSlots: [slot(MONDAY, 8, 10), slot(MONDAY, 10, 12)] });

    expect(resolveAvailability(consecutive, filter({ from: at(9), to: at(11) })).kind).toBe(
      'later',
    );
  });

  it('falls back to the earliest slot when nothing starts after the requested time', () => {
    const availability = resolveAvailability(space(), filter({ from: at(20), to: at(21) }));

    expect(availability).toEqual({ kind: 'later', slot: slot(MONDAY, 8, 12) });
  });

  it('ignores an end time that is not after the start time', () => {
    const availability = resolveAvailability(space(), filter({ from: at(9), to: at(8) }));

    expect(availability).toEqual({ kind: 'free', slot: slot(MONDAY, 8, 12) });
  });

  it('treats a slot ending exactly at the requested start as not covering it', () => {
    const availability = resolveAvailability(space(), filter({ from: at(12), to: null }));

    expect(availability).toEqual({ kind: 'later', slot: slot(MONDAY, 15, 18) });
  });
});

describe('listSpaces', () => {
  const court = space({ id: 'court', name: 'Cancha', category: 'sports' });
  const room = space({ id: 'room', name: 'Sala', category: 'study' });
  const closed = space({
    id: 'closed',
    name: 'Aula cerrada',
    category: 'study',
    underMaintenance: true,
  });

  it('keeps only the requested category', () => {
    const listed = listSpaces([court, room, closed], filter({ category: 'study' }));

    expect(listed.map((entry) => entry.space.id)).toEqual(['room', 'closed']);
  });

  it('ranks bookable spaces before those that are not', () => {
    const listed = listSpaces([closed, court], filter());

    expect(listed.map((entry) => entry.space.id)).toEqual(['court', 'closed']);
  });

  it('orders spaces of equal availability by name', () => {
    const zeta = space({ id: 'zeta', name: 'Zeta' });
    const alpha = space({ id: 'alpha', name: 'Alfa' });

    expect(listSpaces([zeta, alpha], filter()).map((entry) => entry.space.id)).toEqual([
      'alpha',
      'zeta',
    ]);
  });

  it('drops spaces that cannot answer a requested time window', () => {
    const listed = listSpaces([court, closed], filter({ from: at(9), to: at(10) }));

    expect(listed.map((entry) => entry.space.id)).toEqual(['court']);
  });

  it('keeps spaces with nothing left on a requested day when no time is given', () => {
    const listed = listSpaces([court], filter({ date: TUESDAY }));

    expect(listed.map((entry) => entry.availability.kind)).toEqual(['unavailable']);
  });
});

describe('groupByCategory', () => {
  it('groups in declaration order and leaves out empty categories', () => {
    const listed = listSpaces(
      [space({ id: 'room', category: 'study' }), space({ id: 'court', category: 'sports' })],
      filter(),
    );

    expect(groupByCategory(listed).map((group) => group.category)).toEqual<SpaceCategory[]>([
      'sports',
      'study',
    ]);
  });
});

describe('isFilterActive', () => {
  it('treats today with nothing narrowed as the resting state', () => {
    expect(isFilterActive(filter(), MONDAY)).toBe(false);
  });

  it('treats another day as a request', () => {
    expect(isFilterActive(filter({ date: TUESDAY }), MONDAY)).toBe(true);
  });

  it('treats a category or a start time as a request', () => {
    expect(isFilterActive(filter({ category: 'lab' }), MONDAY)).toBe(true);
    expect(isFilterActive(filter({ from: at(9) }), MONDAY)).toBe(true);
  });
});
