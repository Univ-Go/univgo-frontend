import { fromIsoDate, fromIsoDateTime, minutesFromIsoTime, toIsoTime } from './api-time';

describe('minutesFromIsoTime', () => {
  it('reads a clock time as minutes from midnight', () => {
    expect(minutesFromIsoTime('00:00:00')).toBe(0);
    expect(minutesFromIsoTime('14:30:00')).toBe(870);
    expect(minutesFromIsoTime('23:59:00')).toBe(1439);
  });

  it('ignores the seconds, which no block ever carries', () => {
    expect(minutesFromIsoTime('14:30:45')).toBe(870);
  });
});

describe('toIsoTime', () => {
  it('writes minutes from midnight as the clock time the server parses', () => {
    expect(toIsoTime(0)).toBe('00:00:00');
    expect(toIsoTime(870)).toBe('14:30:00');
  });

  it('pads both halves, because a single digit is not a valid time', () => {
    expect(toIsoTime(9 * 60 + 5)).toBe('09:05:00');
  });
});

describe('fromIsoDate', () => {
  it('reads the day on the local calendar, not in UTC', () => {
    const date = fromIsoDate('2026-09-17');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(17);
    expect(date.getHours()).toBe(0);
  });

  it('fails on a malformed day rather than answering with an invalid date', () => {
    expect(() => fromIsoDate('17/09/2026')).toThrow();
  });
});

describe('fromIsoDateTime', () => {
  it('reads a zoneless timestamp as local time, which is the clock the institution runs on', () => {
    const instant = fromIsoDateTime('2026-09-17T14:37:00');

    expect(instant.getFullYear()).toBe(2026);
    expect(instant.getMonth()).toBe(8);
    expect(instant.getDate()).toBe(17);
    expect(instant.getHours()).toBe(14);
    expect(instant.getMinutes()).toBe(37);
  });

  it('keeps the seconds the server sent', () => {
    expect(fromIsoDateTime('2026-09-17T14:37:09').getSeconds()).toBe(9);
  });
});
