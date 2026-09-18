import { type BlockVerdict, type SpaceBlock, blockerOf, isLastMinute } from './space-block';

const MONDAY = new Date(2026, 7, 17);

/** The 14:00–16:00 block of `docs/booking-flow.md` §6, whose three marks are 14:00, 14:30, 14:45. */
function block(overrides: Partial<SpaceBlock> = {}): SpaceBlock {
  return {
    startMinutes: 840,
    endMinutes: 960,
    capacity: 20,
    free: 4,
    checkInOpensAt: new Date(2026, 7, 17, 13, 45),
    checkInClosesAt: new Date(2026, 7, 17, 14, 15),
    blocker: null,
    closureReason: null,
    ...overrides,
  };
}

function verdict(overrides: Partial<BlockVerdict> = {}): BlockVerdict {
  return {
    offered: false,
    free: 5,
    alreadyBookedToday: false,
    overlapsAnother: false,
    closed: false,
    ...overrides,
  };
}

describe('blockerOf', () => {
  it('has nothing to explain about a block that is on offer', () => {
    expect(blockerOf(verdict({ offered: true }))).toBeNull();
  });

  it('says the space is shut before anything else, because nothing else is true of it', () => {
    // Not full — a closed space has every seat — and its hours have not passed either.
    expect(blockerOf(verdict({ closed: true, free: 0, alreadyBookedToday: true }))).toBe('closed');
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

describe('isLastMinute', () => {
  it('reads a window that opens before the block as a booking made in advance', () => {
    expect(isLastMinute(block(), MONDAY)).toBe(false);
  });

  it('reads a window that opens after the block started as a last-minute booking', () => {
    const taken = block({
      checkInOpensAt: new Date(2026, 7, 17, 14, 22),
      checkInClosesAt: new Date(2026, 7, 17, 14, 37),
    });

    expect(isLastMinute(taken, MONDAY)).toBe(true);
  });

  it('does not call the very start of the block last minute', () => {
    const taken = block({ checkInOpensAt: new Date(2026, 7, 17, 14, 0) });

    expect(isLastMinute(taken, MONDAY)).toBe(false);
  });

  it('ignores the time of day carried by the date it is asked about', () => {
    expect(isLastMinute(block(), new Date(2026, 7, 17, 23, 30))).toBe(false);
  });
});
