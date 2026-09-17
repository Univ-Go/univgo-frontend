import { type AdminBlock, blockInProgress } from './admin-block.repository';

function block(startMinutes: number): AdminBlock {
  return { startMinutes, endMinutes: startMinutes + 120, capacity: 10, occupied: 4, free: 6 };
}

const DAY = [block(480), block(720), block(840)];

describe('blockInProgress', () => {
  it('picks the block the clock is inside of', () => {
    expect(blockInProgress(DAY, new Date(2026, 8, 17, 13, 30))?.startMinutes).toBe(720);
  });

  it('takes the start of a block as inside it and its end as outside', () => {
    expect(blockInProgress(DAY, new Date(2026, 8, 17, 12, 0))?.startMinutes).toBe(720);
    expect(blockInProgress(DAY, new Date(2026, 8, 17, 14, 0))?.startMinutes).toBe(840);
  });

  it('answers with nothing between blocks, where no code can be checked against one', () => {
    expect(blockInProgress(DAY, new Date(2026, 8, 17, 11, 0))).toBeUndefined();
    expect(blockInProgress(DAY, new Date(2026, 8, 17, 23, 0))).toBeUndefined();
  });

  it('answers with nothing for a day the space does not open', () => {
    expect(blockInProgress([], new Date(2026, 8, 17, 13, 30))).toBeUndefined();
  });
});
