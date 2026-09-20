import type { Reservation } from './reservation';
import { hasUsablePass, interruptionOf, isActive, isCancellable } from './reservation';

function reservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'court-a',
    code: 'a0f3c1d2',
    spaceId: 'space-1',
    spaceName: 'Cancha de Básquetbol A',
    location: 'Complejo Deportivo Central',
    category: 'sports',
    images: [],
    rules: [],
    date: new Date(2026, 7, 17),
    startMinutes: 840,
    endMinutes: 960,
    state: 'reserved',
    checkInOpensAt: new Date(2026, 7, 17, 13, 45),
    checkInClosesAt: new Date(2026, 7, 17, 14, 15),
    cancelledBy: null,
    closureReason: null,
    ...overrides,
  };
}

describe('a suspended reservation', () => {
  const suspended = reservation({ state: 'suspended', closureReason: 'maintenance' });

  it('still holds its plaza', () => {
    expect(isActive(suspended)).toBe(true);
  });

  it('offers no pass, because the desk would refuse it while the space is shut', () => {
    expect(hasUsablePass(suspended)).toBe(false);
  });

  it('cannot be cancelled by the student', () => {
    expect(isCancellable(suspended)).toBe(false);
  });
});

describe('interruptionOf', () => {
  it('explains a suspended booking', () => {
    expect(interruptionOf(reservation({ state: 'suspended', closureReason: 'maintenance' }))).toBe(
      'suspended',
    );
  });

  it('tells a booking a closure ended from one an administrator cancelled by hand', () => {
    const closed = reservation({
      state: 'cancelled',
      cancelledBy: 'admin',
      closureReason: 'institutional_event',
    });
    const byHand = reservation({ state: 'cancelled', cancelledBy: 'admin' });

    expect(interruptionOf(closed)).toBe('spaceClosed');
    expect(interruptionOf(byHand)).toBe('cancelledByAdmin');
  });

  it('has nothing to explain about a booking the student gave up themselves', () => {
    expect(interruptionOf(reservation({ state: 'cancelled', cancelledBy: 'student' }))).toBeNull();
  });

  it('has nothing to explain about a booking going ahead as booked', () => {
    expect(interruptionOf(reservation())).toBeNull();
    expect(interruptionOf(reservation({ state: 'expired' }))).toBeNull();
  });
});
