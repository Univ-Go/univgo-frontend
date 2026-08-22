import {
  closurePeriodOf,
  closureStatusOf,
  closuresThisMonth,
  listClosures,
  mostFrequentReasonThisMonth,
} from './space-closure-catalog';
import type { ClosureRecurrence, SpaceClosure } from './space-closure';

const NOW = new Date(2026, 7, 20, 14, 0);

function weeklyOnTuesdaysAndThursdays(until: Date | null): ClosureRecurrence {
  return {
    weekdays: [2, 4],
    startTime: new Date(2000, 0, 1, 18, 0),
    endTime: new Date(2000, 0, 1, 20, 0),
    until,
  };
}

function closure(overrides: Partial<SpaceClosure> = {}): SpaceClosure {
  return {
    id: 'closure-1',
    spaceId: 'court-basketball-a',
    scope: 'full_day',
    date: new Date(2026, 7, 20),
    start: null,
    end: null,
    recurrence: null,
    reason: 'maintenance',
    details: null,
    authorizedBy: 'Admin Principal',
    ...overrides,
  };
}

describe('closurePeriodOf', () => {
  it('spans the whole calendar day for a full-day closure', () => {
    const period = closurePeriodOf(closure({ date: new Date(2026, 7, 20) }));

    expect(period.start).toEqual(new Date(2026, 7, 20, 0, 0, 0, 0));
    expect(period.end).toEqual(new Date(2026, 7, 20, 23, 59, 59, 999));
  });

  it('uses the scheduled window for a time-block closure', () => {
    const start = new Date(2026, 7, 20, 14, 0);
    const end = new Date(2026, 7, 20, 18, 0);
    const period = closurePeriodOf(closure({ scope: 'time_block', start, end }));

    expect(period).toEqual({ start, end });
  });

  it('runs from the effective date to the recurrence end date, inclusive', () => {
    const period = closurePeriodOf(
      closure({
        scope: 'recurring',
        date: new Date(2026, 7, 4),
        recurrence: weeklyOnTuesdaysAndThursdays(new Date(2026, 9, 27)),
      }),
    );

    expect(period.start).toEqual(new Date(2026, 7, 4, 0, 0, 0, 0));
    expect(period.end).toEqual(new Date(2026, 9, 27, 23, 59, 59, 999));
  });

  it('has no end date for a recurring closure with no `until`', () => {
    const period = closurePeriodOf(
      closure({
        scope: 'recurring',
        date: new Date(2026, 7, 4),
        recurrence: weeklyOnTuesdaysAndThursdays(null),
      }),
    );

    expect(period.end.getTime()).toBeGreaterThan(new Date(2100, 0, 1).getTime());
  });
});

describe('closureStatusOf', () => {
  it('is scheduled before the period starts', () => {
    const future = closure({ date: new Date(2026, 7, 25) });

    expect(closureStatusOf(future, NOW)).toBe('scheduled');
  });

  it('is active while the period is in effect', () => {
    const ongoing = closure({
      scope: 'time_block',
      start: new Date(2026, 7, 20, 12, 0),
      end: new Date(2026, 7, 20, 16, 0),
    });

    expect(closureStatusOf(ongoing, NOW)).toBe('active');
  });

  it('is completed once the period has ended', () => {
    const past = closure({ date: new Date(2026, 7, 10) });

    expect(closureStatusOf(past, NOW)).toBe('completed');
  });

  it('treats an open-ended recurring closure as active indefinitely', () => {
    const club = closure({
      scope: 'recurring',
      date: new Date(2026, 0, 1),
      recurrence: weeklyOnTuesdaysAndThursdays(null),
    });

    expect(closureStatusOf(club, NOW)).toBe('active');
  });

  it('completes a recurring closure once its `until` date passes', () => {
    const club = closure({
      scope: 'recurring',
      date: new Date(2026, 0, 1),
      recurrence: weeklyOnTuesdaysAndThursdays(new Date(2026, 6, 1)),
    });

    expect(closureStatusOf(club, NOW)).toBe('completed');
  });
});

describe('closuresThisMonth', () => {
  it('counts only closures dated within the reference month', () => {
    const count = closuresThisMonth(
      [
        closure({ date: new Date(2026, 7, 5) }),
        closure({ date: new Date(2026, 7, 20) }),
        closure({ date: new Date(2026, 6, 30) }),
      ],
      NOW,
    );

    expect(count).toBe(2);
  });

  it('counts a standing recurring closure in every month it runs through', () => {
    const count = closuresThisMonth(
      [
        closure({
          scope: 'recurring',
          date: new Date(2026, 0, 6),
          recurrence: weeklyOnTuesdaysAndThursdays(null),
        }),
      ],
      NOW,
    );

    expect(count).toBe(1);
  });
});

describe('mostFrequentReasonThisMonth', () => {
  it('returns null when the month has no closures', () => {
    expect(mostFrequentReasonThisMonth([closure({ date: new Date(2026, 6, 30) })], NOW)).toBeNull();
  });

  it('returns the reason that appears most often this month', () => {
    const reason = mostFrequentReasonThisMonth(
      [
        closure({ date: new Date(2026, 7, 1), reason: 'maintenance' }),
        closure({ date: new Date(2026, 7, 5), reason: 'maintenance' }),
        closure({ date: new Date(2026, 7, 10), reason: 'technical_incident' }),
        closure({ date: new Date(2026, 6, 15), reason: 'other' }),
      ],
      NOW,
    );

    expect(reason).toBe('maintenance');
  });
});

describe('listClosures', () => {
  it('orders by period start, most recent first', () => {
    const oldest = closure({ id: 'a', date: new Date(2026, 7, 1) });
    const newest = closure({ id: 'b', date: new Date(2026, 7, 20) });
    const middle = closure({ id: 'c', date: new Date(2026, 7, 10) });

    expect(listClosures([oldest, newest, middle]).map((entry) => entry.id)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });
});
