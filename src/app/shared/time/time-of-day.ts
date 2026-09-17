import { TuiTime } from '@taiga-ui/cdk';

const MINUTES_PER_HOUR = 60;

/**
 * Minutes from midnight are how the domain talks about a block; a clock string is how a person
 * reads one. The conversion lives here rather than in each view so the three screens of the flow,
 * the catalogue and the reservation list all print an hour the same way.
 */
export function formatTimeOfDay(minutes: number): string {
  return new TuiTime(Math.floor(minutes / MINUTES_PER_HOUR), minutes % MINUTES_PER_HOUR).toString();
}

/** The other direction: where an instant falls inside its own day, in the domain's own unit. */
export function minutesOfDay(instant: Date): number {
  return instant.getHours() * MINUTES_PER_HOUR + instant.getMinutes();
}

export function formatTimeRange(startMinutes: number, endMinutes: number): string {
  return `${formatTimeOfDay(startMinutes)} – ${formatTimeOfDay(endMinutes)}`;
}
