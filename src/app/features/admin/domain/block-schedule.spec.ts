import type { AdminBlock, BlockLoad } from './attendance';
import {
  blockKeyOf,
  blockPhaseOf,
  blockShiftOf,
  clampToNavigableRange,
  daysOf,
  findBlockByKey,
  fullnessBandOf,
  groupBlocksByShift,
  isDayOpen,
  isWithinNavigableRange,
  navigableDayRange,
  startOfWeek,
  weekGridRange,
  CRITICAL_LOAD_RATIO,
  HIGH_LOAD_RATIO,
  occupancyLoadOf,
  parseBlockKey,
  type SpaceDaySummary,
} from './block-schedule';

const BLOCK_MINUTES = 120;
const MS_PER_MINUTE = 60_000;

function block(start: Date, overrides: Partial<AdminBlock> = {}): AdminBlock {
  return {
    capacity: 30,
    occupied: 0,
    free: 30,
    closed: false,
    closureReason: null,
    start,
    end: new Date(start.getTime() + BLOCK_MINUTES * MS_PER_MINUTE),
    ...overrides,
  };
}

function occupancy(overrides: Partial<BlockLoad> = {}): BlockLoad {
  return {
    capacity: 10,
    occupied: 0,
    free: 10,
    ratio: 0,
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

describe('startOfWeek', () => {
  it('leaves a Monday unchanged', () => {
    expect(startOfWeek(new Date(2026, 8, 14, 9, 0)).getDate()).toBe(14);
  });

  it("rolls a mid-week day back to that week's Monday", () => {
    const start = startOfWeek(new Date(2026, 8, 16, 18, 0));

    expect(start.getDate()).toBe(14);
    expect(start.getHours()).toBe(0);
  });

  /** Sunday closes the week that started the Monday before it, not the one that starts the day
   *  after — `Date#getDay()` counts from Sunday, which this has to read against. */
  it('treats Sunday as the last day of its week, not the first of the next', () => {
    expect(startOfWeek(new Date(2026, 8, 13)).getDate()).toBe(7);
  });

  it('crosses a month boundary', () => {
    const start = startOfWeek(new Date(2026, 9, 1));

    expect(start.getMonth()).toBe(8);
    expect(start.getDate()).toBe(28);
  });
});

describe('weekGridRange', () => {
  it('spans the current week and the next one, Monday through Sunday', () => {
    const range = weekGridRange(new Date(2026, 8, 16, 18, 0));

    expect(range.from.getDate()).toBe(14);
    expect(range.to.getDate()).toBe(27);
    expect(range.to.getHours()).toBe(0);
  });

  /** Not "the next 14 days": asking from a Sunday would otherwise start on that Sunday and cut the
   *  grid's first row down to a single day. */
  it('starts on the Monday of the current week regardless of where today falls in it', () => {
    const fromSunday = weekGridRange(new Date(2026, 8, 13));
    const fromMonday = weekGridRange(new Date(2026, 8, 7));

    expect(fromSunday.from.getTime()).toBe(fromMonday.from.getTime());
  });
});

describe('daysOf', () => {
  it('lists every day of a two-week range, inclusive', () => {
    const range = weekGridRange(new Date(2026, 8, 16));
    const days = daysOf(range);

    expect(days).toHaveLength(14);
    expect(days[0].getTime()).toBe(range.from.getTime());
    expect(days[13].getTime()).toBe(range.to.getTime());
  });

  it('collapses to a single day when both bounds are the same', () => {
    const day = new Date(2026, 8, 16);

    expect(daysOf({ from: day, to: day })).toHaveLength(1);
  });
});

describe('isDayOpen', () => {
  function summary(overrides: Partial<SpaceDaySummary> = {}): SpaceDaySummary {
    return { date: new Date(2026, 8, 16), totalCapacity: 40, totalFree: 12, ...overrides };
  }

  it('is open when the day has any capacity on record', () => {
    expect(isDayOpen(summary())).toBe(true);
  });

  /** Zero capacity is a day the space never opened, not one that filled up — the same reading
   *  `fullnessBandOf` gives a block with no capacity on record. */
  it('is closed, not full, when the day has no capacity at all', () => {
    expect(isDayOpen(summary({ totalCapacity: 0, totalFree: 0 }))).toBe(false);
  });

  it('is open even with every seat taken', () => {
    expect(isDayOpen(summary({ totalFree: 0 }))).toBe(true);
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

describe('blockShiftOf', () => {
  it('reads midnight through 11:59 as morning', () => {
    expect(blockShiftOf(block(new Date(2026, 8, 13, 0, 0)))).toBe('morning');
    expect(blockShiftOf(block(new Date(2026, 8, 13, 11, 59)))).toBe('morning');
  });

  it('turns to afternoon exactly at noon', () => {
    expect(blockShiftOf(block(new Date(2026, 8, 13, 12, 0)))).toBe('afternoon');
    expect(blockShiftOf(block(new Date(2026, 8, 13, 17, 59)))).toBe('afternoon');
  });

  it('turns to night exactly at 18:00', () => {
    expect(blockShiftOf(block(new Date(2026, 8, 13, 18, 0)))).toBe('night');
    expect(blockShiftOf(block(new Date(2026, 8, 13, 23, 0)))).toBe('night');
  });
});

describe('groupBlocksByShift', () => {
  it('splits blocks into their shift, morning first', () => {
    const night = block(new Date(2026, 8, 13, 19, 0));
    const morning = block(new Date(2026, 8, 13, 8, 0));
    const afternoon = block(new Date(2026, 8, 13, 14, 0));

    const groups = groupBlocksByShift([night, morning, afternoon]);

    expect(groups.map((group) => group.shift)).toEqual(['morning', 'afternoon', 'night']);
    expect(groups[0].blocks).toEqual([morning]);
    expect(groups[1].blocks).toEqual([afternoon]);
    expect(groups[2].blocks).toEqual([night]);
  });

  it('omits a shift with no blocks in it', () => {
    const morning = block(new Date(2026, 8, 13, 8, 0));

    expect(groupBlocksByShift([morning]).map((group) => group.shift)).toEqual(['morning']);
  });

  it('returns nothing for an empty day', () => {
    expect(groupBlocksByShift([])).toEqual([]);
  });

  it('spans a group from its earliest start to its latest end', () => {
    const first = block(new Date(2026, 8, 13, 6, 0));
    const last = block(new Date(2026, 8, 13, 10, 30));

    const [group] = groupBlocksByShift([last, first]);

    expect(group.from).toEqual(first.start);
    expect(group.to).toEqual(last.end);
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
