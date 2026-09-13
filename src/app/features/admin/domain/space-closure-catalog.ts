import { startOfDay } from '../../../shared/time/calendar-day';
import type { ClosureReason, ClosureStatus, SpaceClosure } from './space-closure';

function endOfDay(date: Date): Date {
  const end = new Date(date);

  end.setHours(23, 59, 59, 999);

  return end;
}

/** The largest date `Date` can represent — stands in for "no end" so a standing recurring block
 *  reads as perpetually active instead of needing a second code path through every function below. */
const INDEFINITE = new Date(8640000000000000);

/**
 * A full-day closure spans the calendar day; a time-block one is exactly what was scheduled; a
 * recurring one starts on `date` and runs until `recurrence.until`, or forever if that is `null`.
 */
export function closurePeriodOf(closure: SpaceClosure): { start: Date; end: Date } {
  if (closure.scope === 'time_block' && closure.start !== null && closure.end !== null) {
    return { start: closure.start, end: closure.end };
  }

  if (closure.scope === 'recurring') {
    const until = closure.recurrence?.until ?? null;

    return { start: startOfDay(closure.date), end: until === null ? INDEFINITE : endOfDay(until) };
  }

  return { start: startOfDay(closure.date), end: endOfDay(closure.date) };
}

/** Computed from the clock rather than stored, so nothing has to flip it at the right instant. */
export function closureStatusOf(closure: SpaceClosure, now: Date): ClosureStatus {
  const { start, end } = closurePeriodOf(closure);

  if (now.getTime() < start.getTime()) {
    return 'scheduled';
  }

  return now.getTime() <= end.getTime() ? 'active' : 'completed';
}

function monthRange(reference: Date): { start: Date; end: Date } {
  return {
    start: new Date(reference.getFullYear(), reference.getMonth(), 1),
    end: new Date(reference.getFullYear(), reference.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}

/** Whether any part of the closure's period falls inside the reference month — not just its start,
 *  so a standing recurring block keeps counting in every month it runs through, not only its first. */
function activeDuringMonth(closure: SpaceClosure, now: Date): boolean {
  const period = closurePeriodOf(closure);
  const month = monthRange(now);

  return (
    period.start.getTime() <= month.end.getTime() && period.end.getTime() >= month.start.getTime()
  );
}

export function closuresThisMonth(closures: readonly SpaceClosure[], now: Date): number {
  return closures.filter((closure) => activeDuringMonth(closure, now)).length;
}

/**
 * The reason that comes up most often this month, for the desk to spot a pattern (a court closing
 * for maintenance three times running is worth a longer fix). `null` when there is nothing yet to
 * summarise, which is a real state and not an error: a quiet month has no frequent reason.
 */
export function mostFrequentReasonThisMonth(
  closures: readonly SpaceClosure[],
  now: Date,
): ClosureReason | null {
  const thisMonth = closures.filter((closure) => activeDuringMonth(closure, now));

  if (thisMonth.length === 0) {
    return null;
  }

  const counts = new Map<ClosureReason, number>();

  for (const closure of thisMonth) {
    counts.set(closure.reason, (counts.get(closure.reason) ?? 0) + 1);
  }

  let mostFrequent = thisMonth[0].reason;
  let highestCount = 0;

  for (const [reason, count] of counts) {
    if (count > highestCount) {
      mostFrequent = reason;
      highestCount = count;
    }
  }

  return mostFrequent;
}

/** Most recent first: the desk cares about what just happened or is about to. */
export function listClosures(closures: readonly SpaceClosure[]): readonly SpaceClosure[] {
  return [...closures].sort(
    (one, other) => closurePeriodOf(other).start.getTime() - closurePeriodOf(one).start.getTime(),
  );
}
