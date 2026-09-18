import type { ClosureReason, SpaceClosure } from './space-closure';

/** The largest instant `Date` can hold — what "no end date" means when a period has to be compared. */
const INDEFINITE = new Date(8640000000000000);

function monthRange(reference: Date): { start: Date; end: Date } {
  return {
    start: new Date(reference.getFullYear(), reference.getMonth(), 1),
    end: new Date(reference.getFullYear(), reference.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}

/**
 * Whether any part of the closure falls inside the reference month — not just its start, so one
 * that has been running since August still counts in September, which is the month somebody is
 * looking at.
 */
function activeDuringMonth(closure: SpaceClosure, now: Date): boolean {
  const month = monthRange(now);
  const end = closure.endsAt ?? INDEFINITE;

  return (
    closure.startsAt.getTime() <= month.end.getTime() && end.getTime() >= month.start.getTime()
  );
}

export function closuresThisMonth(closures: readonly SpaceClosure[], now: Date): number {
  return closures.filter((closure) => activeDuringMonth(closure, now)).length;
}

/**
 * The reason that comes up most often this month, for the desk to spot a pattern: a court closing
 * for maintenance three times running is worth a longer fix. `null` when there is nothing to
 * summarise, which is a real state and not an error — a quiet month has no frequent reason.
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
