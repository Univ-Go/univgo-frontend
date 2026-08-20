import { TestBed } from '@angular/core/testing';
import type { Space } from '../../spaces/domain/space';
import { BookingDraftStore } from './booking-draft.store';

function space(overrides: Partial<Space> = {}): Space {
  return {
    id: 'court-a',
    name: 'Cancha A',
    location: 'Complejo Deportivo',
    category: 'sports',
    capacity: 20,
    underMaintenance: false,
    freeSlots: [],
    ...overrides,
  };
}

function tomorrow(): Date {
  const date = new Date();

  date.setDate(date.getDate() + 1);

  return date;
}

describe('BookingDraftStore', () => {
  let store: BookingDraftStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [BookingDraftStore] });

    store = TestBed.inject(BookingDraftStore);
  });

  it('has nothing to schedule until a space and an hour are chosen', () => {
    expect(store.booking()).toBeNull();

    store.selectSpace(space());

    expect(store.booking()).toBeNull();

    store.setStartMinutes(600);

    expect(store.booking()?.startMinutes).toBe(600);
  });

  it('keeps the chosen hour when the user walks back and picks the same space again', () => {
    store.selectSpace(space());
    store.setStartMinutes(600);
    store.selectSpace(space());

    expect(store.startMinutes()).toBe(600);
  });

  it('drops the chosen hour when the space changes, because another space has other hours', () => {
    store.selectSpace(space());
    store.setStartMinutes(600);
    store.selectSpace(space({ id: 'room-3' }));

    expect(store.startMinutes()).toBeNull();
  });

  it('drops the chosen hour when the day changes', () => {
    store.selectSpace(space());
    store.setStartMinutes(600);
    store.setDate(tomorrow());

    expect(store.startMinutes()).toBeNull();
  });

  it('ignores the time of day, so re-picking the same day keeps the hour', () => {
    const morning = new Date(2026, 7, 17, 9, 30);
    const evening = new Date(2026, 7, 17, 20, 15);

    store.setDate(morning);
    store.selectSpace(space());
    store.setStartMinutes(600);
    store.setDate(evening);

    expect(store.startMinutes()).toBe(600);
  });

  it('reports which space is the chosen one, which is what marks a card in the catalogue', () => {
    store.selectSpace(space());

    expect(store.isSelected('court-a')).toBe(true);
    expect(store.isSelected('room-3')).toBe(false);
  });

  it('creates no reservation code while the draft is incomplete', () => {
    store.selectSpace(space());
    store.confirm();

    expect(store.reservationCode()).toBeNull();
  });

  it('creates a reservation code once the draft is complete', () => {
    store.selectSpace(space());
    store.setStartMinutes(600);
    store.confirm();

    expect(store.reservationCode()).toMatch(/^UG-\d{4}$/);
  });

  it('has nothing to lose before a space is picked, and nothing left once it was created', () => {
    expect(store.hasUnsavedChoice()).toBe(false);

    store.selectSpace(space());

    expect(store.hasUnsavedChoice()).toBe(true);

    store.setStartMinutes(600);
    store.confirm();

    expect(store.hasUnsavedChoice()).toBe(false);
  });

  it('empties every answer on reset, which is what starting another booking needs', () => {
    store.selectSpace(space());
    store.setStartMinutes(600);
    store.confirm();
    store.reset();

    expect(store.space()).toBeNull();
    expect(store.startMinutes()).toBeNull();
    expect(store.booking()).toBeNull();
    expect(store.reservationCode()).toBeNull();
  });
});
