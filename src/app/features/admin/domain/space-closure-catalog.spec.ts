import type { SpaceClosure } from './space-closure';
import { closuresThisMonth, mostFrequentReasonThisMonth } from './space-closure-catalog';

const NOW = new Date(2026, 7, 20, 14, 0);

function closure(overrides: Partial<SpaceClosure> = {}): SpaceClosure {
  return {
    id: 'closure-1',
    spaceId: 'court-basketball-a',
    startsAt: new Date(2026, 7, 20, 8, 0),
    endsAt: new Date(2026, 7, 20, 20, 0),
    reason: 'maintenance',
    details: null,
    createdAt: new Date(2026, 7, 19, 9, 0),
    revertedAt: null,
    ...overrides,
  };
}

describe('closuresThisMonth', () => {
  it('counts the closures of the month somebody is looking at', () => {
    const closures = [
      closure({ id: 'this-month' }),
      closure({
        id: 'last-month',
        startsAt: new Date(2026, 6, 4, 8, 0),
        endsAt: new Date(2026, 6, 4, 20, 0),
      }),
    ];

    expect(closuresThisMonth(closures, NOW)).toBe(1);
  });

  it('counts one that started earlier and is still running', () => {
    const sinceJuly = closure({
      id: 'running',
      startsAt: new Date(2026, 6, 4, 8, 0),
      endsAt: new Date(2026, 8, 4, 8, 0),
    });

    expect(closuresThisMonth([sinceJuly], NOW)).toBe(1);
  });

  it('counts one with no end date, whichever month it started in', () => {
    const indefinite = closure({
      id: 'indefinite',
      startsAt: new Date(2026, 5, 1, 8, 0),
      endsAt: null,
    });

    expect(closuresThisMonth([indefinite], NOW)).toBe(1);
  });

  it('counts a reverted closure too: it happened, and the history is the point', () => {
    const reverted = closure({ id: 'reverted', revertedAt: new Date(2026, 7, 20, 10, 0) });

    expect(closuresThisMonth([reverted], NOW)).toBe(1);
  });
});

describe('mostFrequentReasonThisMonth', () => {
  it('answers the reason that comes up most often', () => {
    const closures = [
      closure({ id: 'one', reason: 'maintenance' }),
      closure({ id: 'two', reason: 'maintenance' }),
      closure({ id: 'three', reason: 'technical_incident' }),
    ];

    expect(mostFrequentReasonThisMonth(closures, NOW)).toBe('maintenance');
  });

  it('ignores the closures of another month', () => {
    const closures = [
      closure({ id: 'this-month', reason: 'external_use' }),
      closure({
        id: 'last-month',
        reason: 'maintenance',
        startsAt: new Date(2026, 6, 4, 8, 0),
        endsAt: new Date(2026, 6, 4, 20, 0),
      }),
      closure({
        id: 'last-month-too',
        reason: 'maintenance',
        startsAt: new Date(2026, 6, 5, 8, 0),
        endsAt: new Date(2026, 6, 5, 20, 0),
      }),
    ];

    expect(mostFrequentReasonThisMonth(closures, NOW)).toBe('external_use');
  });

  it('answers with nothing for a quiet month, which is a state and not an error', () => {
    expect(mostFrequentReasonThisMonth([], NOW)).toBeNull();
  });
});
