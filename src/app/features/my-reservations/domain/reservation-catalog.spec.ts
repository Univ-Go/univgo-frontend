import { SPACE_CATEGORIES } from '../../spaces/domain/space';
import type { Reservation } from './reservation';
import { RESERVATION_STATUSES } from './reservation';
import type { ReservationFilter } from './reservation-catalog';
import { findNextReservation, listReservations } from './reservation-catalog';

const MONDAY = new Date(2026, 7, 17);
const TUESDAY = new Date(2026, 7, 18);
const WEDNESDAY = new Date(2026, 7, 19);

function reservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'court-a',
    spaceName: 'Cancha de Básquetbol A',
    location: 'Complejo Deportivo Central',
    date: MONDAY,
    time: '14:00 – 16:00',
    status: 'upcoming',
    category: 'sports',
    rules: [],
    ...overrides,
  };
}

function filter(overrides: Partial<ReservationFilter> = {}): ReservationFilter {
  return {
    statuses: new Set(RESERVATION_STATUSES),
    categories: new Set(SPACE_CATEGORIES),
    from: null,
    to: null,
    ...overrides,
  };
}

describe('listReservations', () => {
  it('keeps every booking when nothing is narrowed down', () => {
    const bookings = [reservation({ id: 'one' }), reservation({ id: 'two', status: 'past' })];

    expect(listReservations(bookings, filter())).toEqual(bookings);
  });

  it('drops the bookings whose status was unticked', () => {
    const upcoming = reservation({ id: 'upcoming', status: 'upcoming' });
    const past = reservation({ id: 'past', status: 'past' });

    const listed = listReservations([upcoming, past], filter({ statuses: new Set(['past']) }));

    expect(listed).toEqual([past]);
  });

  it('drops the bookings whose category was unticked', () => {
    const sports = reservation({ id: 'sports', category: 'sports' });
    const lab = reservation({ id: 'lab', category: 'lab' });

    const listed = listReservations([sports, lab], filter({ categories: new Set(['lab']) }));

    expect(listed).toEqual([lab]);
  });

  it('answers with nothing when every option of a filter is unticked', () => {
    expect(listReservations([reservation()], filter({ statuses: new Set() }))).toEqual([]);
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

    expect(listed).toEqual([first, last]);
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

  it('preserves the order it was given', () => {
    const later = reservation({ id: 'later', date: WEDNESDAY });
    const sooner = reservation({ id: 'sooner', date: MONDAY });

    expect(listReservations([later, sooner], filter())).toEqual([later, sooner]);
  });
});

describe('findNextReservation', () => {
  it('picks the soonest booking that has not finished', () => {
    const soonest = reservation({ id: 'soonest', date: TUESDAY, status: 'ongoing' });
    const later = reservation({ id: 'later', date: WEDNESDAY, status: 'upcoming' });
    const finished = reservation({ id: 'finished', date: MONDAY, status: 'past' });

    expect(findNextReservation([later, finished, soonest])).toBe(soonest);
  });

  it('answers with nothing when every booking has finished', () => {
    expect(findNextReservation([reservation({ status: 'past' })])).toBeUndefined();
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
