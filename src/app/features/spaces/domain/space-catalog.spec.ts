import type { Space, SpaceCategory, SpaceFilter, SpaceSlot } from './space';
import {
  countActiveFilters,
  groupByCategory,
  isFilterActive,
  listSpaces,
  resolveAvailability,
} from './space-catalog';

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
    opensOnDate: true,
    closedOnDate: false,
    freeSlots: [slot(MONDAY, 8, 12), slot(MONDAY, 15, 18)],
    ...overrides,
  };
}

function filter(overrides: Partial<SpaceFilter> = {}): SpaceFilter {
  return { category: null, date: MONDAY, from: null, query: null, ...overrides };
}

describe('resolveAvailability', () => {
  it('tells a shut space from a full one and from one that does not open that day', () => {
    const closed = space({ closedOnDate: true, freeSlots: [] });
    const full = space({ freeSlots: [] });
    const notOpen = space({ opensOnDate: false, freeSlots: [] });

    expect(resolveAvailability(closed, filter())).toEqual({ kind: 'closed' });
    expect(resolveAvailability(full, filter())).toEqual({ kind: 'full' });
    expect(resolveAvailability(notOpen, filter())).toEqual({ kind: 'notOpen' });
  });

  it('calls a space shut even on a day it would not have opened anyway', () => {
    // Otherwise "no abre" hides that somebody closed it, which is a decision and not a timetable.
    const closed = space({ opensOnDate: false, closedOnDate: true, freeSlots: [] });

    expect(resolveAvailability(closed, filter())).toEqual({ kind: 'closed' });
  });

  it('reports the earliest slot of the day when no start time is requested', () => {
    expect(resolveAvailability(space(), filter())).toEqual({
      kind: 'free',
      slot: slot(MONDAY, 8, 12),
    });
  });

  it('reports free when one slot holds a whole booking from the requested start', () => {
    const availability = resolveAvailability(space(), filter({ from: at(9) }));

    expect(availability).toEqual({ kind: 'free', slot: slot(MONDAY, 8, 12) });
  });

  it('reports the next slot when a booking from the requested start would spill past the end', () => {
    const availability = resolveAvailability(space(), filter({ from: at(11, 30) }));

    expect(availability).toEqual({ kind: 'later', slot: slot(MONDAY, 15, 18) });
  });

  it('does not stitch two consecutive slots into one bookable window', () => {
    const consecutive = space({ freeSlots: [slot(MONDAY, 8, 10), slot(MONDAY, 10, 12)] });

    expect(resolveAvailability(consecutive, filter({ from: at(9, 30) })).kind).toBe('later');
  });

  it('falls back to the earliest slot when nothing starts after the requested time', () => {
    const availability = resolveAvailability(space(), filter({ from: at(20) }));

    expect(availability).toEqual({ kind: 'later', slot: slot(MONDAY, 8, 12) });
  });

  it('treats a slot ending exactly at the requested start as not covering it', () => {
    const availability = resolveAvailability(space(), filter({ from: at(12) }));

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
    closedOnDate: true,
    freeSlots: [],
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

  it('drops spaces that cannot answer a requested start time', () => {
    const listed = listSpaces([court, closed], filter({ from: at(9) }));

    expect(listed.map((entry) => entry.space.id)).toEqual(['court']);
  });

  it('keeps spaces with nothing left on a requested day when no time is given', () => {
    const listed = listSpaces([court], filter({ date: TUESDAY }));

    expect(listed.map((entry) => entry.availability.kind)).toEqual(['full']);
  });
});

describe('listSpaces, searching', () => {
  const court = space({ id: 'court', name: 'Cancha de Básquetbol A', location: 'Zona Norte' });
  const room = space({ id: 'room', name: 'Sala de Estudio 3', location: 'Biblioteca Central' });

  function found(query: string): readonly string[] {
    return listSpaces([court, room], filter({ query })).map((listed) => listed.space.id);
  }

  it('ignores accents, because nobody reaches for the accent key to search', () => {
    expect(found('basquetbol')).toEqual(['court']);
  });

  it('ignores case', () => {
    expect(found('SALA')).toEqual(['room']);
  });

  it('searches where a space is, not only what it is called', () => {
    expect(found('biblioteca')).toEqual(['room']);
  });

  it('narrows with every term instead of widening', () => {
    expect(found('cancha norte')).toEqual(['court']);
    expect(found('cancha biblioteca')).toEqual([]);
  });

  it('lists everything for blank input, so spaces alone are not a filter', () => {
    expect(found('   ')).toEqual(['court', 'room']);
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

describe('countActiveFilters', () => {
  it('counts nothing on the resting state', () => {
    expect(countActiveFilters(filter(), MONDAY)).toBe(0);
  });

  it('counts each narrowing once', () => {
    expect(countActiveFilters(filter({ category: 'lab' }), MONDAY)).toBe(1);
    expect(countActiveFilters(filter({ category: 'lab', from: at(9) }), MONDAY)).toBe(2);
    expect(
      countActiveFilters(filter({ category: 'lab', from: at(9), date: TUESDAY }), MONDAY),
    ).toBe(3);
  });

  it('leaves the typed query out: the search field is on screen saying so itself', () => {
    expect(countActiveFilters(filter({ query: 'cancha' }), MONDAY)).toBe(0);
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

  it('treats typed text as a request, and blanks as nothing typed', () => {
    expect(isFilterActive(filter({ query: 'cancha' }), MONDAY)).toBe(true);
    expect(isFilterActive(filter({ query: '   ' }), MONDAY)).toBe(false);
  });
});
