import type { Space } from '../../spaces/domain/space';
import { BOOKING_DURATION_MINUTES } from '../../spaces/domain/space';
import { scheduleBooking } from './booking-draft';

const MONDAY = new Date(2026, 7, 17);

const COURT: Space = {
  id: 'court-a',
  name: 'Cancha A',
  location: 'Complejo Deportivo',
  category: 'sports',
  capacity: 20,
  underMaintenance: false,
  freeSlots: [],
};

describe('scheduleBooking', () => {
  it('refuses a draft without a space, however complete the rest is', () => {
    expect(scheduleBooking({ space: null, date: MONDAY, startMinutes: 600 })).toBeNull();
  });

  it('refuses a draft without a start time', () => {
    expect(scheduleBooking({ space: COURT, date: MONDAY, startMinutes: null })).toBeNull();
  });

  it('closes the booking one slot after the chosen start', () => {
    const booking = scheduleBooking({ space: COURT, date: MONDAY, startMinutes: 600 });

    expect(booking).toEqual({
      space: COURT,
      date: MONDAY,
      startMinutes: 600,
      endMinutes: 600 + BOOKING_DURATION_MINUTES,
    });
  });
});
