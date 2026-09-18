import { TestBed } from '@angular/core/testing';
import { type Observable, of } from 'rxjs';
import type { Reservation } from '../../my-reservations/domain/reservation';
import {
  type BookingRequest,
  ReservationRepository,
} from '../../my-reservations/domain/reservation.repository';
import type { Space } from '../../spaces/domain/space';
import type { SpaceBlock } from '../../spaces/domain/space-block';
import { BookingDraftStore } from './booking-draft.store';

const CREATED: Reservation = {
  id: 'reservation-1',
  code: 'a0f3c1d2',
  spaceId: 'court-a',
  spaceName: 'Cancha A',
  location: 'Complejo Deportivo',
  category: 'sports',
  date: new Date(2026, 7, 17),
  startMinutes: 840,
  endMinutes: 960,
  state: 'reserved',
  checkInOpensAt: new Date(2026, 7, 17, 13, 45),
  checkInClosesAt: new Date(2026, 7, 17, 14, 15),
  cancelledBy: null,
  closureReason: null,
};

class FakeReservationRepository extends ReservationRepository {
  public requests: BookingRequest[] = [];

  create(request: BookingRequest): Observable<Reservation> {
    this.requests.push(request);

    return of(CREATED);
  }

  mine(): Observable<readonly Reservation[]> {
    return of([]);
  }

  findById(): Observable<Reservation | null> {
    return of(null);
  }

  cancel(): Observable<Reservation> {
    return of(CREATED);
  }
}

function space(overrides: Partial<Space> = {}): Space {
  return {
    id: 'court-a',
    name: 'Cancha A',
    location: 'Complejo Deportivo',
    category: 'sports',
    capacity: 20,
    underMaintenance: false,
    opensOnDate: true,
    closedOnDate: false,
    freeSlots: [],
    images: [],
    ...overrides,
  };
}

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

function tomorrow(): Date {
  const date = new Date();

  date.setDate(date.getDate() + 1);

  return date;
}

describe('BookingDraftStore', () => {
  let store: BookingDraftStore;
  let repository: FakeReservationRepository;

  beforeEach(() => {
    repository = new FakeReservationRepository();

    TestBed.configureTestingModule({
      providers: [BookingDraftStore, { provide: ReservationRepository, useValue: repository }],
    });

    store = TestBed.inject(BookingDraftStore);
  });

  it('has nothing to schedule until a space and a block are chosen', () => {
    expect(store.booking()).toBeNull();

    store.selectSpace(space());

    expect(store.booking()).toBeNull();

    store.selectBlock(block());

    expect(store.booking()?.startMinutes).toBe(840);
  });

  it('keeps the chosen block when the user walks back and picks the same space again', () => {
    store.selectSpace(space());
    store.selectBlock(block());
    store.selectSpace(space());

    expect(store.block()?.startMinutes).toBe(840);
  });

  it('drops the chosen block when the space changes, because another space has other hours', () => {
    store.selectSpace(space());
    store.selectBlock(block());
    store.selectSpace(space({ id: 'room-3' }));

    expect(store.block()).toBeNull();
  });

  it('drops the chosen block when the day changes', () => {
    store.selectSpace(space());
    store.selectBlock(block());
    store.setDate(tomorrow());

    expect(store.block()).toBeNull();
  });

  it('ignores the time of day, so re-picking the same day keeps the block', () => {
    const morning = new Date(2026, 7, 17, 9, 30);
    const evening = new Date(2026, 7, 17, 20, 15);

    store.setDate(morning);
    store.selectSpace(space());
    store.selectBlock(block());
    store.setDate(evening);

    expect(store.block()?.startMinutes).toBe(840);
  });

  it('reports which space is the chosen one, which is what marks a card in the catalogue', () => {
    store.selectSpace(space());

    expect(store.isSelected('court-a')).toBe(true);
    expect(store.isSelected('room-3')).toBe(false);
  });

  it('asks for nothing while the draft is incomplete', () => {
    store.selectSpace(space());
    store.confirm().subscribe();

    expect(repository.requests).toEqual([]);
    expect(store.reservation()).toBeNull();
  });

  it('sends the three answers the student gave and keeps what the server created', () => {
    store.setDate(new Date(2026, 7, 17, 11, 0));
    store.selectSpace(space());
    store.selectBlock(block());
    store.confirm().subscribe();

    expect(repository.requests).toEqual([
      { spaceId: 'court-a', date: new Date(2026, 7, 17), startMinutes: 840 },
    ]);
    expect(store.reservation()).toBe(CREATED);
  });

  it('has nothing to lose before a space is picked, and nothing left once it was created', () => {
    expect(store.hasUnsavedChoice()).toBe(false);

    store.selectSpace(space());

    expect(store.hasUnsavedChoice()).toBe(true);

    store.selectBlock(block());
    store.confirm().subscribe();

    expect(store.hasUnsavedChoice()).toBe(false);
  });

  it('empties every answer on reset, which is what starting another booking needs', () => {
    store.selectSpace(space());
    store.selectBlock(block());
    store.confirm().subscribe();
    store.reset();

    expect(store.space()).toBeNull();
    expect(store.block()).toBeNull();
    expect(store.booking()).toBeNull();
    expect(store.reservation()).toBeNull();
  });
});
