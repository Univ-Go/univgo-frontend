import { parseIsoDate } from './calendar-day';

/**
 * The wire formats the API speaks in, translated once. The server works in the institution's own
 * calendar — `LocalDate`, `LocalTime` and `LocalDateTime`, never an instant with an offset — so
 * everything here is read and written as local time on purpose. Writing a day is `toIsoDate` from
 * `calendar-day`, which this deliberately does not duplicate.
 */

const MINUTES_PER_HOUR = 60;

const TWO_DIGITS = 2;

function pad(value: number): string {
  return String(value).padStart(TWO_DIGITS, '0');
}

/**
 * Strict, through the same parser the URL uses: a malformed day is a broken contract with the
 * server, not a state to render, so it fails where it happens instead of reaching a view as
 * `Invalid Date`.
 */
export function fromIsoDate(value: string): Date {
  const parsed = parseIsoDate(value);

  if (parsed === null) {
    throw new Error(`Malformed date in an API response: ${value}`);
  }

  return parsed;
}

/** `HH:mm:ss` as minutes from midnight, which is how the domain compares and formats an hour. */
export function minutesFromIsoTime(value: string): number {
  const [hours, minutes] = value.split(':');

  return Number(hours) * MINUTES_PER_HOUR + Number(minutes);
}

export function toIsoTime(minutes: number): string {
  return `${pad(Math.floor(minutes / MINUTES_PER_HOUR))}:${pad(minutes % MINUTES_PER_HOUR)}:00`;
}

/** `2026-09-17T13:45:00`, which JavaScript reads as local time exactly because it carries no zone. */
export function fromIsoDateTime(value: string): Date {
  const [date, time] = value.split('T');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  const parsed = fromIsoDate(date);

  parsed.setHours(hours, minutes, Math.trunc(seconds));

  return parsed;
}
