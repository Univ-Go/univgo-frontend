import { TuiTime } from '@taiga-ui/cdk';

const MINUTES_PER_HOUR = 60;

/**
 * Minutes from midnight are how the domain talks about a slot; a clock string is how a person reads
 * one. The conversion lives here rather than in each view so the three screens of the flow, the
 * catalogue and the reservation list all print an hour the same way.
 */
export function formatBookingTime(minutes: number): string {
  return new TuiTime(Math.floor(minutes / MINUTES_PER_HOUR), minutes % MINUTES_PER_HOUR).toString();
}

export function formatBookingRange(startMinutes: number, endMinutes: number): string {
  return `${formatBookingTime(startMinutes)} – ${formatBookingTime(endMinutes)}`;
}
