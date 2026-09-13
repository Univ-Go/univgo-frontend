/**
 * Calendar days, as opposed to instants. Everything here works on the viewer's local calendar: a
 * "day" is what somebody standing in front of the panel would point at, which is not a fixed number
 * of milliseconds and is not the same window as the UTC day.
 *
 * Shared because the panel writes a day into the URL and reads it back, and the two halves have to
 * agree on which day a string names. Several features still carry their own private `startOfDay`;
 * they are deliberately left alone, and they are not interchangeable with this one — one of them
 * returns epoch milliseconds and another folds in an offset.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function startOfDay(date: Date): Date {
  const start = new Date(date);

  start.setHours(0, 0, 0, 0);

  return start;
}

/**
 * Calendar arithmetic, not milliseconds: a day is 23 or 25 hours across a daylight-saving
 * transition, so adding a fixed 86 400 000 lands an hour off and, at the edges, on the wrong day.
 */
export function addDays(date: Date, days: number): Date {
  const shifted = new Date(date);

  shifted.setDate(shifted.getDate() + days);

  return shifted;
}

export function isSameDay(one: Date, other: Date): boolean {
  return (
    one.getFullYear() === other.getFullYear() &&
    one.getMonth() === other.getMonth() &&
    one.getDate() === other.getDate()
  );
}

/**
 * `YYYY-MM-DD` from the local calendar, for the URL. Built from the local components rather than
 * from `toISOString()`, which converts to UTC first and therefore names the previous day for any
 * viewer behind Greenwich — the whole west of the Atlantic, silently, and only for part of the day.
 */
export function toIsoDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * The inverse, and strict: anything that is not exactly `YYYY-MM-DD` naming a real date is `null`,
 * so a hand-edited URL lands on a fallback instead of on `Invalid Date`. `new Date(value)` is not
 * used at all — it parses this format as UTC midnight, which is the same off-by-one-day as above.
 */
export function parseIsoDate(value: string | null | undefined): Date | null {
  const match = ISO_DATE.exec(value ?? '');

  if (match === null) {
    return null;
  }

  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));

  // Rolls over rather than failing: `new Date(2026, 12, 45)` is a valid date in 2027. Comparing the
  // components back is what separates a real date from one that overflowed into another.
  return parsed.getFullYear() === Number(year) &&
    parsed.getMonth() === Number(month) - 1 &&
    parsed.getDate() === Number(day)
    ? parsed
    : null;
}
