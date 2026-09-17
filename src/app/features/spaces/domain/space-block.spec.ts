import { type BlockVerdict, blockerOf } from './space-block';

function verdict(overrides: Partial<BlockVerdict> = {}): BlockVerdict {
  return {
    offered: false,
    free: 5,
    alreadyBookedToday: false,
    overlapsAnother: false,
    ...overrides,
  };
}

describe('blockerOf', () => {
  it('has nothing to explain about a block that is on offer', () => {
    expect(blockerOf(verdict({ offered: true }))).toBeNull();
  });

  it('reports a block with no plazas left as full', () => {
    expect(blockerOf(verdict({ free: 0 }))).toBe('full');
  });

  it('reports the reservation the student already holds here today', () => {
    expect(blockerOf(verdict({ alreadyBookedToday: true }))).toBe('alreadyBooked');
  });

  it('reports the clash with another reservation of theirs', () => {
    expect(blockerOf(verdict({ overlapsAnother: true }))).toBe('overlaps');
  });

  it('prefers the reason that blocks every block over the one that blocks this one', () => {
    expect(blockerOf(verdict({ free: 0, alreadyBookedToday: true }))).toBe('alreadyBooked');
    expect(blockerOf(verdict({ free: 0, overlapsAnother: true }))).toBe('overlaps');
  });

  it('reads a block with plazas and no clash as one whose time has passed', () => {
    expect(blockerOf(verdict())).toBe('tooLate');
  });
});
