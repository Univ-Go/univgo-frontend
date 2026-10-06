import { formatCountdown } from './countdown';

describe('formatCountdown', () => {
  it('reads a wait as hours, minutes and seconds', () => {
    expect(formatCountdown((1 * 3600 + 2 * 60 + 3) * 1000)).toBe('01:02:03');
  });

  it('keeps counting hours past a day', () => {
    expect(formatCountdown(50 * 3600 * 1000)).toBe('50:00:00');
  });

  it('rounds a partial second up, so the countdown only reads zero once it has passed', () => {
    expect(formatCountdown(500)).toBe('00:00:01');
    expect(formatCountdown(0)).toBe('00:00:00');
  });

  it('never reads a negative wait', () => {
    expect(formatCountdown(-5000)).toBe('00:00:00');
  });
});
