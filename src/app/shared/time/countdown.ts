const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const TWO_DIGITS = 2;

/**
 * `HH:mm:ss` for a wait still to run, rounded up so the last second reads `00:00:01` rather than
 * `00:00:00` before it has actually passed. Hours are not wrapped at 24: a penalty can outlast a day.
 */
export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / MS_PER_SECOND));
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  return [hours, minutes, seconds].map((part) => String(part).padStart(TWO_DIGITS, '0')).join(':');
}
