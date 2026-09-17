import { SPACE_CATEGORIES } from '../../spaces/domain/space';
import type { Reservation } from './reservation';
import { RESERVATION_STATES } from './reservation';
import type { ReservationFilter } from './reservation-catalog';
import { findNextReservation, listReservations } from './reservation-catalog';

const MONDAY = new Date(2026, 7, 17);
const TUESDAY = new Date(2026, 7, 18);
const WEDNESDAY = new Date(2026, 7, 19);

function reservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'court-a',
    code: 'a0f3c1d2',
    spaceId: 'space-1',
    spaceName: 'Cancha de Básquetbol A',
    location: 'Complejo Deportivo Central',
    category: 'sports',
    date: MONDAY,
    startMinutes: 840,
    endMinutes: 960,
    state: 'reserved',
    checkInOpensAt: new Date(2026, 7, 17, 13, 45),
    checkInClosesAt: new Date(2026, 7, 17, 14, 15),
    ...overrides,
  };
}

function filter(overrides: Partial<ReservationFilter> = {}): ReservationFilter {
  return {
    states: new Set(RESERVATION_STATES),
    categories: new Set(SPACE_CATEGORIES),
    from: null,
    to: null,
    ...overrides,
  };
}

describe('listReservations', () => {
  it('keeps every booking when nothing is narrowed down', () => {
    const bookings = [reservation({ id: 'one' }), reservation({ id: 'two', state: 'finished' })];

    expect(listReservations(bookings, filter())).toEqual(bookings);
  });

  it('drops the bookings whose state was unticked', () => {
    const live = reservation({ id: 'live', state: 'reserved' });
    const finished = reservation({ id: 'finished', state: 'finished' });

    const listed = listReservations([live, finished], filter({ states: new Set(['finished']) }));

    expect(listed).toEqual([finished]);
  });

  it('tells a booking the student gave up from one they let expire', () => {
    const cancelled = reservation({ id: 'cancelled', state: 'cancelled' });
    const expired = reservation({ id: 'expired', state: 'expired' });

    const listed = listReservations([cancelled, expired], filter({ states: new Set(['expired']) }));

    expect(listed).toEqual([expired]);
  });

  it('drops the bookings whose category was unticked', () => {
    const sports = reservation({ id: 'sports', category: 'sports' });
    const lab = reservation({ id: 'lab', category: 'lab' });

    const listed = listReservations([sports, lab], filter({ categories: new Set(['lab']) }));

    expect(listed).toEqual([lab]);
  });

  it('answers with nothing when every option of a filter is unticked', () => {
    expect(listReservations([reservation()], filter({ states: new Set() }))).toEqual([]);
    expect(listReservations([reservation()], filter({ categories: new Set() }))).toEqual([]);
  });

  it('includes both ends of the day range', () => {
    const first = reservation({ id: 'first', date: MONDAY });
    const last = reservation({ id: 'last', date: WEDNESDAY });
    const outside = reservation({ id: 'outside', date: new Date(2026, 7, 20) });

    const listed = listReservations(
      [first, last, outside],
      filter({ from: MONDAY, to: WEDNESDAY }),
    );

    expect(listed.map((entry) => entry.id)).toEqual(['first', 'last']);
  });

  it('compares days, not instants, at either end of the range', () => {
    const lateOnMonday = reservation({ id: 'late', date: new Date(2026, 7, 17, 23, 30) });

    expect(listReservations([lateOnMonday], filter({ from: MONDAY, to: MONDAY }))).toEqual([
      lateOnMonday,
    ]);
  });

  it('leaves the side without an end unbounded', () => {
    const monday = reservation({ id: 'monday', date: MONDAY });
    const wednesday = reservation({ id: 'wednesday', date: WEDNESDAY });

    expect(listReservations([monday, wednesday], filter({ from: TUESDAY }))).toEqual([wednesday]);
    expect(listReservations([monday, wednesday], filter({ to: TUESDAY }))).toEqual([monday]);
  });

  it('puts the bookings that still hold a plaza first, soonest at the top', () => {
    const finished = reservation({ id: 'finished', date: MONDAY, state: 'finished' });
    const later = reservation({ id: 'later', date: WEDNESDAY, state: 'reserved' });
    const sooner = reservation({ id: 'sooner', date: TUESDAY, state: 'inProgress' });

    const listed = listReservations([finished, later, sooner], filter());

    expect(listed.map((entry) => entry.id)).toEqual(['sooner', 'later', 'finished']);
  });

  it('ranks the history the other way round, most recent first', () => {
    const older = reservation({ id: 'older', date: MONDAY, state: 'finished' });
    const newer = reservation({ id: 'newer', date: WEDNESDAY, state: 'cancelled' });

    const listed = listReservations([older, newer], filter());

    expect(listed.map((entry) => entry.id)).toEqual(['newer', 'older']);
  });

  it('separates two bookings on the same day by their hour', () => {
    const morning = reservation({ id: 'morning', startMinutes: 480, endMinutes: 600 });
    const afternoon = reservation({ id: 'afternoon', startMinutes: 840, endMinutes: 960 });

    const listed = listReservations([afternoon, morning], filter());

    expect(listed.map((entry) => entry.id)).toEqual(['morning', 'afternoon']);
  });

  it('does not reorder the list it was given', () => {
    const later = reservation({ id: 'later', date: WEDNESDAY });
    const sooner = reservation({ id: 'sooner', date: MONDAY });
    const bookings = [later, sooner];

    listReservations(bookings, filter());

    expect(bookings).toEqual([later, sooner]);
  });
});

describe('findNextReservation', () => {
  it('picks the soonest booking that still holds a plaza', () => {
    const soonest = reservation({ id: 'soonest', date: TUESDAY, state: 'inProgress' });
    const later = reservation({ id: 'later', date: WEDNESDAY, state: 'reserved' });
    const finished = reservation({ id: 'finished', date: MONDAY, state: 'finished' });

    expect(findNextReservation([later, finished, soonest])).toBe(soonest);
  });

  it('ignores the bookings that lost their plaza, whichever way they lost it', () => {
    const expired = reservation({ id: 'expired', date: TUESDAY, state: 'expired' });
    const cancelled = reservation({ id: 'cancelled', date: MONDAY, state: 'cancelled' });
    const live = reservation({ id: 'live', date: WEDNESDAY, state: 'reserved' });

    expect(findNextReservation([expired, cancelled, live])).toBe(live);
  });

  it('answers with nothing when every booking is over', () => {
    expect(findNextReservation([reservation({ state: 'finished' })])).toBeUndefined();
  });

  it('answers with nothing when there are no bookings at all', () => {
    expect(findNextReservation([])).toBeUndefined();
  });

  it('does not reorder the list it was given', () => {
    const later = reservation({ id: 'later', date: WEDNESDAY });
    const sooner = reservation({ id: 'sooner', date: MONDAY });
    const bookings = [later, sooner];

    findNextReservation(bookings);

    expect(bookings).toEqual([later, sooner]);
  });
});
