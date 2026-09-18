import type { Space } from '../../spaces/domain/space';
import type { SpaceBlock } from '../../spaces/domain/space-block';
import { scheduleBooking } from './booking-draft';

const MONDAY = new Date(2026, 7, 17);

const COURT: Space = {
  id: 'court-a',
  name: 'Cancha A',
  location: 'Complejo Deportivo',
  category: 'sports',
  capacity: 20,
  underMaintenance: false,
  opensOnDate: true,
  closedOnDate: false,
  freeSlots: [],
};

/** 14:00–16:00 with the check-in window of a booking made well in advance. */
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

describe('scheduleBooking', () => {
  it('refuses a draft without a space, however complete the rest is', () => {
    expect(scheduleBooking({ space: null, date: MONDAY, block: block() })).toBeNull();
  });

  it('refuses a draft without a block', () => {
    expect(scheduleBooking({ space: COURT, date: MONDAY, block: null })).toBeNull();
  });

  it('takes the hours from the block the server answered with', () => {
    const booking = scheduleBooking({ space: COURT, date: MONDAY, block: block() });

    expect(booking).toEqual({
      space: COURT,
      date: MONDAY,
      startMinutes: 840,
      endMinutes: 960,
      checkInClosesAt: new Date(2026, 7, 17, 14, 15),
      lastMinute: false,
    });
  });

  it('marks a block whose check-in window opens after it started as a last-minute booking', () => {
    const booking = scheduleBooking({
      space: COURT,
      date: MONDAY,
      block: block({
        checkInOpensAt: new Date(2026, 7, 17, 14, 22),
        checkInClosesAt: new Date(2026, 7, 17, 14, 37),
      }),
    });

    expect(booking?.lastMinute).toBe(true);
    expect(booking?.checkInClosesAt).toEqual(new Date(2026, 7, 17, 14, 37));
  });
});
