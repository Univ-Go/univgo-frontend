import { blockInProgress } from './admin-block.repository';
import type { AdminBlock } from './attendance';

const MS_PER_HOUR = 3_600_000;

function block(hours: number): AdminBlock {
  const start = new Date(2026, 8, 17, hours, 0);

  return {
    start,
    end: new Date(start.getTime() + 2 * MS_PER_HOUR),
    capacity: 10,
    occupied: 4,
    free: 6,
  };
}

const DAY = [block(8), block(12), block(14)];

describe('blockInProgress', () => {
  it('picks the block the clock is inside of', () => {
    expect(blockInProgress(DAY, new Date(2026, 8, 17, 13, 30))?.start.getHours()).toBe(12);
  });

  it('takes the start of a block as inside it and its end as outside', () => {
    expect(blockInProgress(DAY, new Date(2026, 8, 17, 12, 0))?.start.getHours()).toBe(12);
    expect(blockInProgress(DAY, new Date(2026, 8, 17, 14, 0))?.start.getHours()).toBe(14);
  });

  it('answers with nothing between blocks, where no code can be checked against one', () => {
    expect(blockInProgress(DAY, new Date(2026, 8, 17, 11, 0))).toBeUndefined();
    expect(blockInProgress(DAY, new Date(2026, 8, 17, 23, 0))).toBeUndefined();
  });

  it('answers with nothing for a day the space does not open', () => {
    expect(blockInProgress([], new Date(2026, 8, 17, 13, 30))).toBeUndefined();
  });
});
