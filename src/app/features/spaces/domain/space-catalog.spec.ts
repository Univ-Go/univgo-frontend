import type { Space, SpaceCategory, SpaceFilter, SpaceSlot } from './space';
import {
  groupByCategory,
  isFilterActive,
  listSpaces,
  listStartOptions,
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
    freeSlots: [slot(MONDAY, 8, 12), slot(MONDAY, 15, 18)],
    ...overrides,
  };
}

function filter(overrides: Partial<SpaceFilter> = {}): SpaceFilter {
  return { category: null, date: MONDAY, from: null, to: null, query: null, ...overrides };
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

describe('listStartOptions', () => {
  function starts(space: Space, date: Date, step: number): readonly number[] {
    return listStartOptions(space, date, 60, step)
      .filter((option) => option.available)
      .map((option) => option.minutes);
  }

  it('steps through a window at the requested granularity', () => {
    const oneSlot = space({ freeSlots: [slot(MONDAY, 8, 10)] });

    expect(starts(oneSlot, MONDAY, 30)).toEqual([at(8), at(8, 30), at(9)]);
  });

  it('drops a window shorter than the requested duration instead of stitching it to the next one', () => {
    const shortThenLong = space({
      freeSlots: [
        { date: MONDAY, from: at(8), to: at(8, 30) },
        { date: MONDAY, from: at(8, 30), to: at(10) },
      ],
    });

    expect(starts(shortThenLong, MONDAY, 30)).toEqual([at(8, 30), at(9)]);
  });

  it('collects starts across every window of the day, not just the first', () => {
    expect(starts(space(), MONDAY, 60)).toEqual([
      at(8),
      at(9),
      at(10),
      at(11),
      at(15),
      at(16),
      at(17),
    ]);
  });

  it('keeps the hours between two windows in the grid, marked as taken', () => {
    const options = listStartOptions(space(), MONDAY, 60, 60);

    expect(options.filter((option) => !option.available).map((option) => option.minutes)).toEqual([
      at(12),
      at(13),
      at(14),
    ]);
  });

  it('reports nothing on a day the space has no free slot', () => {
    expect(listStartOptions(space(), TUESDAY, 60, 30)).toEqual([]);
  });

  it('reports nothing for a space under maintenance, whatever its slots say', () => {
    expect(listStartOptions(space({ underMaintenance: true }), MONDAY, 60, 60)).toEqual([]);
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
