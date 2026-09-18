import type { SpaceClosure } from './space-closure';
import { closureStatusOf, isRevertible } from './space-closure';

const NOW = new Date(2026, 8, 17, 14, 0);

function closure(overrides: Partial<SpaceClosure> = {}): SpaceClosure {
  return {
    id: 'closure-1',
    spaceId: 'court-a',
    startsAt: new Date(2026, 8, 17, 8, 0),
    endsAt: new Date(2026, 8, 17, 20, 0),
    reason: 'maintenance',
    details: null,
    createdAt: new Date(2026, 8, 16, 9, 0),
    revertedAt: null,
    ...overrides,
  };
}

describe('closureStatusOf', () => {
  it('is in force while the clock is inside its window', () => {
    expect(closureStatusOf(closure(), NOW)).toBe('active');
  });

  it('is scheduled before it starts', () => {
    const tomorrow = closure({
      startsAt: new Date(2026, 8, 18, 8, 0),
      endsAt: new Date(2026, 8, 18, 20, 0),
    });

    expect(closureStatusOf(tomorrow, NOW)).toBe('scheduled');
  });

  it('is finished once its window has passed', () => {
    const yesterday = closure({
      startsAt: new Date(2026, 8, 16, 8, 0),
      endsAt: new Date(2026, 8, 16, 20, 0),
    });

    expect(closureStatusOf(yesterday, NOW)).toBe('finished');
  });

  it('never finishes on its own without an end date', () => {
    expect(closureStatusOf(closure({ endsAt: null }), NOW)).toBe('active');
    expect(closureStatusOf(closure({ endsAt: null }), new Date(2027, 0, 1))).toBe('active');
  });

  it('reads as reverted whatever its window says, because somebody reopened the space', () => {
    const reopened = closure({ revertedAt: new Date(2026, 8, 17, 10, 0) });

    expect(closureStatusOf(reopened, NOW)).toBe('reverted');
  });
});

describe('isRevertible', () => {
  it('offers the way back for anything still in force, started or not', () => {
    expect(isRevertible(closure())).toBe(true);
    expect(isRevertible(closure({ endsAt: null }))).toBe(true);
  });

  it('does not offer it twice', () => {
    expect(isRevertible(closure({ revertedAt: new Date(2026, 8, 17, 10, 0) }))).toBe(false);
  });
});
