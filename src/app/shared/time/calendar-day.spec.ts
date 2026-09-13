import { addDays, isSameDay, parseIsoDate, startOfDay, toIsoDate } from './calendar-day';

describe('startOfDay', () => {
  it('zeroes the time and keeps the calendar date', () => {
    const start = startOfDay(new Date(2026, 8, 13, 17, 42, 9, 512));

    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(8);
    expect(start.getDate()).toBe(13);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
  });

  it('does not mutate the date it is given', () => {
    const original = new Date(2026, 8, 13, 17, 42);

    startOfDay(original);

    expect(original.getHours()).toBe(17);
  });
});

describe('addDays', () => {
  it('crosses a month boundary', () => {
    const next = addDays(new Date(2026, 0, 31), 1);

    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(1);
  });

  it('crosses a year boundary', () => {
    const next = addDays(new Date(2026, 11, 31), 1);

    expect(next.getFullYear()).toBe(2027);
    expect(next.getMonth()).toBe(0);
    expect(next.getDate()).toBe(1);
  });

  it('walks backwards', () => {
    const previous = addDays(new Date(2026, 2, 1), -1);

    expect(previous.getMonth()).toBe(1);
    expect(previous.getDate()).toBe(28);
  });

  /**
   * Asserted as a property of the calendar rather than against a pinned timezone: a day is 23 or 25
   * hours across a daylight-saving transition, so an implementation adding a fixed 86 400 000 lands
   * at 23:00 the day before or 01:00 the day after. Checking that midnight stays midnight catches
   * that wherever the suite runs, without the config change a real DST fixture would need.
   */
  it('keeps midnight at midnight on every day of a year', () => {
    let day = startOfDay(new Date(2026, 0, 1));

    for (let index = 0; index < 365; index++) {
      const next = addDays(day, 1);

      expect(next.getHours()).toBe(0);
      day = next;
    }
  });

  it('does not mutate the date it is given', () => {
    const original = new Date(2026, 8, 13);

    addDays(original, 5);

    expect(original.getDate()).toBe(13);
  });
});

describe('isSameDay', () => {
  it('is true for two instants on the same local day', () => {
    expect(isSameDay(new Date(2026, 8, 13, 0, 0), new Date(2026, 8, 13, 23, 59))).toBe(true);
  });

  it('is false across local midnight', () => {
    expect(isSameDay(new Date(2026, 8, 13, 23, 59), new Date(2026, 8, 14, 0, 0))).toBe(false);
  });

  it('is false for the same day of a different month or year', () => {
    expect(isSameDay(new Date(2026, 8, 13), new Date(2026, 9, 13))).toBe(false);
    expect(isSameDay(new Date(2026, 8, 13), new Date(2027, 8, 13))).toBe(false);
  });
});

describe('toIsoDate', () => {
  it('zero-pads the month and the day', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('names the local day, not the UTC one', () => {
    const lateEvening = new Date(2026, 8, 13, 23, 30);

    expect(toIsoDate(lateEvening)).toBe('2026-09-13');
  });
});

describe('parseIsoDate', () => {
  it('returns the local start of that day', () => {
    const parsed = parseIsoDate('2026-09-13');

    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(8);
    expect(parsed?.getDate()).toBe(13);
    expect(parsed?.getHours()).toBe(0);
  });

  /** The off-by-one-day trap: `new Date('2026-09-13')` is UTC midnight, which is the 12th for any
   *  viewer behind Greenwich. Round-tripping every day of a year proves neither half drifts. */
  it('round-trips every day of a year through toIsoDate', () => {
    let day = startOfDay(new Date(2026, 0, 1));

    for (let index = 0; index < 365; index++) {
      expect(isSameDay(parseIsoDate(toIsoDate(day)) as Date, day)).toBe(true);
      day = addDays(day, 1);
    }
  });

  it.each([
    ['', 'empty'],
    ['hoy', 'a word'],
    ['2026-9-13', 'unpadded'],
    ['2026/09/13', 'the wrong separator'],
    ['2026-09-13T10:00:00Z', 'an instant rather than a day'],
  ])('returns null for %s (%s)', (value) => {
    expect(parseIsoDate(value)).toBeNull();
  });

  it('returns null for null and undefined', () => {
    expect(parseIsoDate(null)).toBeNull();
    expect(parseIsoDate(undefined)).toBeNull();
  });

  /** `new Date(2026, 12, 45)` is a valid date in 2027 rather than an error, so a well-shaped string
   *  naming a day that does not exist has to be rejected by comparing the components back. */
  it.each(['2026-13-01', '2026-00-10', '2026-02-30', '2026-09-31', '2026-09-00'])(
    'returns null for the well-shaped but impossible %s',
    (value) => {
      expect(parseIsoDate(value)).toBeNull();
    },
  );

  it('accepts a leap day in a leap year and rejects it otherwise', () => {
    expect(parseIsoDate('2028-02-29')).not.toBeNull();
    expect(parseIsoDate('2026-02-29')).toBeNull();
  });
});
