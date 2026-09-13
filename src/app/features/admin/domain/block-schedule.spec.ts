import type { BlockOccupancy, CapacityBlock } from './attendance';
import {
  blockKeyOf,
  blockPhaseOf,
  clampToNavigableRange,
  findBlockByKey,
  fullnessBandOf,
  isWithinNavigableRange,
  navigableDayRange,
  CRITICAL_LOAD_RATIO,
  HIGH_LOAD_RATIO,
  occupancyLoadOf,
  parseBlockKey,
} from './block-schedule';

const BLOCK_MINUTES = 120;
const MS_PER_MINUTE = 60_000;

function block(start: Date, overrides: Partial<CapacityBlock> = {}): CapacityBlock {
  return {
    spaceId: 'court-basketball-a',
    spaceName: 'Cancha de Básquetbol A',
    capacity: 30,
    start,
    end: new Date(start.getTime() + BLOCK_MINUTES * MS_PER_MINUTE),
    attendees: [],
    ...overrides,
  };
}

function occupancy(overrides: Partial<BlockOccupancy> = {}): BlockOccupancy {
  return {
    capacity: 10,
    occupied: 0,
    free: 10,
    inRoom: 0,
    pending: 0,
    ratio: 0,
    attended: 0,
    missed: 0,
    ...overrides,
  };
}

describe('blockPhaseOf', () => {
  const start = new Date(2026, 8, 13, 14, 0);
  const afternoon = block(start);

  it('is live at the exact instant the block starts', () => {
    expect(blockPhaseOf(afternoon, start)).toBe('live');
  });

  it('is upcoming a millisecond before it starts', () => {
    expect(blockPhaseOf(afternoon, new Date(start.getTime() - 1))).toBe('upcoming');
  });

  it('is live a millisecond before it ends', () => {
    expect(blockPhaseOf(afternoon, new Date(afternoon.end.getTime() - 1))).toBe('live');
  });

  /** The half-open end is what keeps a block out of two phases at once: the instant 16:00 arrives
   *  the 14:00 block is over and the 16:00 one has begun. */
  it('is past at the exact instant the block ends', () => {
    expect(blockPhaseOf(afternoon, afternoon.end)).toBe('past');
  });

  it('reads instants and not hours of the day', () => {
    const tomorrowMorning = block(new Date(2026, 8, 14, 8, 0));

    expect(blockPhaseOf(tomorrowMorning, new Date(2026, 8, 13, 20, 0))).toBe('upcoming');
  });

  it('places every block of a past day in the past', () => {
    const yesterday = block(new Date(2026, 8, 12, 18, 0));

    expect(blockPhaseOf(yesterday, new Date(2026, 8, 13, 9, 0))).toBe('past');
  });
});

describe('fullnessBandOf', () => {
  it('is full when no seat is free', () => {
    expect(fullnessBandOf(occupancy({ occupied: 10, free: 0, ratio: 1 }))).toBe('full');
  });

  it('is nearly full exactly at the threshold', () => {
    expect(fullnessBandOf(occupancy({ occupied: 8, free: 2, ratio: HIGH_LOAD_RATIO }))).toBe(
      'nearlyFull',
    );
  });

  it('is available just below the threshold', () => {
    expect(fullnessBandOf(occupancy({ occupied: 7, free: 3, ratio: 0.7 }))).toBe('available');
  });

  /** The badge turns where the meter turns colour: a bar already warning while the pill still read
   *  "Disponible" would be two answers to the same question. */
  it('turns at the same ratio the meter does', () => {
    expect(fullnessBandOf(occupancy({ occupied: 75, free: 25, capacity: 100, ratio: 0.75 }))).toBe(
      'nearlyFull',
    );
    expect(occupancyLoadOf(occupancy({ capacity: 100, ratio: 0.75 }))).toBe('high');
  });

  it('is available for an empty block', () => {
    expect(fullnessBandOf(occupancy())).toBe('available');
  });

  /** A capacity nobody stated is unknown, not full — the same refusal `occupancyOf` makes when it
   *  declines to draw a meter for it. */
  it('treats an unknown capacity as available rather than full', () => {
    expect(fullnessBandOf(occupancy({ capacity: 0, free: 0, ratio: 0 }))).toBe('available');
  });

  it('never reports past full for an overbooked block', () => {
    expect(fullnessBandOf(occupancy({ capacity: 10, occupied: 12, free: 0, ratio: 1 }))).toBe(
      'full',
    );
  });
});

describe('occupancyLoadOf', () => {
  it('is low while there is comfortable room', () => {
    expect(occupancyLoadOf(occupancy({ capacity: 100, ratio: 0 }))).toBe('low');
    expect(occupancyLoadOf(occupancy({ capacity: 100, ratio: 0.74 }))).toBe('low');
  });

  it('is high from the first threshold, inclusive', () => {
    expect(occupancyLoadOf(occupancy({ capacity: 100, ratio: HIGH_LOAD_RATIO }))).toBe('high');
    expect(occupancyLoadOf(occupancy({ capacity: 100, ratio: 0.89 }))).toBe('high');
  });

  it('is critical from the second threshold, inclusive', () => {
    expect(occupancyLoadOf(occupancy({ capacity: 100, ratio: CRITICAL_LOAD_RATIO }))).toBe(
      'critical',
    );
    expect(occupancyLoadOf(occupancy({ capacity: 100, ratio: 1 }))).toBe('critical');
  });

  /** Unknown is not saturated: an empty meter for a capacity nobody stated would be an assertion. */
  it('treats an unknown capacity as low rather than critical', () => {
    expect(occupancyLoadOf(occupancy({ capacity: 0, free: 0, ratio: 0 }))).toBe('low');
  });

  it('keeps the two thresholds in order', () => {
    expect(HIGH_LOAD_RATIO).toBeLessThan(CRITICAL_LOAD_RATIO);
  });
});

describe('navigableDayRange', () => {
  const now = new Date(2026, 8, 13, 14, 30);

  it('spans the configured days either side of today, at the start of each day', () => {
    const range = navigableDayRange(now, 7, 7);

    expect(range.from.getDate()).toBe(6);
    expect(range.to.getDate()).toBe(20);
    expect(range.from.getHours()).toBe(0);
    expect(range.to.getHours()).toBe(0);
  });

  it('collapses to today alone when both numbers are zero', () => {
    const range = navigableDayRange(now, 0, 0);

    expect(range.from.getTime()).toBe(range.to.getTime());
    expect(range.from.getDate()).toBe(13);
  });

  it('never inverts, even when given negative numbers', () => {
    const range = navigableDayRange(now, -5, -5);

    expect(range.from.getTime()).toBeLessThanOrEqual(range.to.getTime());
  });

  it('crosses a month boundary', () => {
    const range = navigableDayRange(new Date(2026, 8, 2, 10, 0), 7, 7);

    expect(range.from.getMonth()).toBe(7);
    expect(range.from.getDate()).toBe(26);
  });
});

describe('isWithinNavigableRange', () => {
  const range = navigableDayRange(new Date(2026, 8, 13, 14, 30), 7, 7);

  it('accepts both bounds', () => {
    expect(isWithinNavigableRange(new Date(2026, 8, 6), range)).toBe(true);
    expect(isWithinNavigableRange(new Date(2026, 8, 20), range)).toBe(true);
  });

  it('accepts any instant of a day inside the range', () => {
    expect(isWithinNavigableRange(new Date(2026, 8, 20, 23, 59), range)).toBe(true);
  });

  it('rejects the days just outside it', () => {
    expect(isWithinNavigableRange(new Date(2026, 8, 5), range)).toBe(false);
    expect(isWithinNavigableRange(new Date(2026, 8, 21), range)).toBe(false);
  });
});

describe('clampToNavigableRange', () => {
  const range = navigableDayRange(new Date(2026, 8, 13, 14, 30), 7, 7);

  it('pulls a day before the window up to the first bound', () => {
    expect(clampToNavigableRange(new Date(2025, 0, 1), range).getTime()).toBe(range.from.getTime());
  });

  it('pulls a day after the window down to the last bound', () => {
    expect(clampToNavigableRange(new Date(2027, 0, 1), range).getTime()).toBe(range.to.getTime());
  });

  it('leaves the bounds themselves alone', () => {
    expect(clampToNavigableRange(range.from, range).getTime()).toBe(range.from.getTime());
    expect(clampToNavigableRange(range.to, range).getTime()).toBe(range.to.getTime());
  });

  it('normalises an instant inside the range to the start of its day', () => {
    const clamped = clampToNavigableRange(new Date(2026, 8, 15, 17, 42), range);

    expect(clamped.getDate()).toBe(15);
    expect(clamped.getHours()).toBe(0);
  });
});

describe('blockKeyOf', () => {
  it('zero-pads the hour', () => {
    expect(blockKeyOf(block(new Date(2026, 8, 13, 6, 0)))).toBe('06-00');
  });

  it('keeps the minutes of a block that does not start on the hour', () => {
    expect(blockKeyOf(block(new Date(2026, 8, 13, 14, 30)))).toBe('14-30');
  });
});

describe('parseBlockKey', () => {
  it('reads the two numbers', () => {
    expect(parseBlockKey('14-00')).toEqual({ hours: 14, minutes: 0 });
  });

  it('round-trips every block of a campus day', () => {
    for (let hour = 0; hour < 24; hour += 2) {
      const key = blockKeyOf(block(new Date(2026, 8, 13, hour, 0)));

      expect(parseBlockKey(key)).toEqual({ hours: hour, minutes: 0 });
    }
  });

  it.each(['14:00', '1400', '4-0', '25-00', '14-60', 'abc', ''])('returns null for %s', (key) => {
    expect(parseBlockKey(key)).toBeNull();
  });

  it('returns null for null and undefined', () => {
    expect(parseBlockKey(null)).toBeNull();
    expect(parseBlockKey(undefined)).toBeNull();
  });
});

describe('findBlockByKey', () => {
  const blocks = [
    block(new Date(2026, 8, 13, 8, 0)),
    block(new Date(2026, 8, 13, 14, 0)),
    block(new Date(2026, 8, 13, 16, 0)),
  ];

  it('finds the block that starts at that time', () => {
    expect(findBlockByKey(blocks, '14-00')?.start.getHours()).toBe(14);
  });

  /** A key carried over from a space with different opening hours names a block that is genuinely
   *  not there; showing a different one would be worse than saying so. */
  it('returns undefined for a valid key with no block that day', () => {
    expect(findBlockByKey(blocks, '10-00')).toBeUndefined();
  });

  it('returns undefined for an empty day', () => {
    expect(findBlockByKey([], '14-00')).toBeUndefined();
  });

  it('returns undefined for an unreadable key', () => {
    expect(findBlockByKey(blocks, '14:00')).toBeUndefined();
  });
});
