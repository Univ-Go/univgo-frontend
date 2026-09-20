import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { type Observable, of } from 'rxjs';
import { APP_CONFIG, type AppConfig } from '../../../core/config/app-config';
import { httpErrorInterceptor } from '../../../core/http/http-error.interceptor';
import { Logger } from '../../../core/logging/logger';
import { NotificationService } from '../../../core/notifications/notification.service';
import type { Space } from '../../spaces/domain/space';
import type { SpaceBlock } from '../../spaces/domain/space-block';
import { SpaceRepository } from '../../spaces/domain/space.repository';
import type { Reservation } from '../domain/reservation';
import { ReservationRepository } from '../domain/reservation.repository';
import { HttpReservationRepository } from './http-reservation.repository';

const API_BASE_URL = 'http://localhost:3000';

const COURT: Space = {
  id: 'f2e1',
  name: 'Cancha de Tenis de Campo A',
  location: 'Complejo Deportivo Central',
  category: 'sports',
  capacity: 4,
  underMaintenance: false,
  opensOnDate: true,
  closedOnDate: false,
  freeSlots: [],
  images: ['https://cdn.univgo.test/court-a.jpg'],
  description: 'Cancha de tenis de campo en superficie dura.',
  rules: ['Usa calzado de tenis de suela lisa.'],
};

const RESERVATION_PAYLOAD = {
  id: 'r-1',
  qrCodeData: 'a0f3c1d2-1111-2222-3333-444455556666',
  userId: 'u-1',
  spaceId: 'f2e1',
  reservationDate: '2026-09-17',
  blockStart: '14:00:00',
  blockEnd: '16:00:00',
  state: 'RESERVED',
  createdAt: '2026-09-16T10:00:00',
  checkedInAt: null,
  cancelledAt: null,
  cancelledBy: null,
  closureReason: null,
  checkInOpensAt: '2026-09-17T13:45:00',
  checkInClosesAt: '2026-09-17T14:15:00',
};

/** The catalogue is the directory the adapter joins against; how it is read is its own test. */
class FakeSpaceRepository extends SpaceRepository {
  catalog(): Observable<readonly Space[]> {
    return of([COURT]);
  }

  findById(id: string): Observable<Space | null> {
    return of(id === COURT.id ? COURT : null);
  }

  availability(): Observable<readonly SpaceBlock[]> {
    return of([]);
  }
}

describe('HttpReservationRepository', () => {
  let repository: ReservationRepository;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // The interceptor is what turns a failed request into an `AppError`, and `findById` reads
        // that vocabulary to tell a missing booking from a failure. Without it here the adapter
        // would be tested against a transport error it never sees in the application.
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: { error: vi.fn() } },
        { provide: Logger, useValue: { error: vi.fn(), warn: vi.fn() } },
        { provide: APP_CONFIG, useValue: { apiBaseUrl: API_BASE_URL } as AppConfig },
        { provide: SpaceRepository, useClass: FakeSpaceRepository },
        { provide: ReservationRepository, useClass: HttpReservationRepository },
      ],
    });

    repository = TestBed.inject(ReservationRepository);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('sends the day and the hour in the calendar the server reads, not in UTC', () => {
    repository
      .create({ spaceId: 'f2e1', date: new Date(2026, 0, 5), startMinutes: 540 })
      .subscribe();

    const request = controller.expectOne(`${API_BASE_URL}/reservations`);

    expect(request.request.body).toEqual({
      spaceId: 'f2e1',
      reservationDate: '2026-01-05',
      startTime: '09:00:00',
    });
    request.flush(RESERVATION_PAYLOAD);
  });

  it('answers the created booking with its code, its hours and its check-in window', async () => {
    const created = new Promise<Reservation>((resolve) =>
      repository
        .create({ spaceId: 'f2e1', date: new Date(2026, 8, 17), startMinutes: 840 })
        .subscribe(resolve),
    );

    controller.expectOne(`${API_BASE_URL}/reservations`).flush(RESERVATION_PAYLOAD);

    expect(await created).toEqual({
      id: 'r-1',
      code: 'a0f3c1d2-1111-2222-3333-444455556666',
      spaceId: 'f2e1',
      spaceName: 'Cancha de Tenis de Campo A',
      location: 'Complejo Deportivo Central',
      category: 'sports',
      images: ['https://cdn.univgo.test/court-a.jpg'],
      rules: ['Usa calzado de tenis de suela lisa.'],
      date: new Date(2026, 8, 17),
      startMinutes: 840,
      endMinutes: 960,
      state: 'reserved',
      checkInOpensAt: new Date(2026, 8, 17, 13, 45),
      checkInClosesAt: new Date(2026, 8, 17, 14, 15),
      cancelledBy: null,
      closureReason: null,
    });
  });

  it('gives every booking the identity of its space, which the list itself never carries', async () => {
    const mine = new Promise<readonly Reservation[]>((resolve) =>
      repository.mine().subscribe(resolve),
    );

    controller
      .expectOne(`${API_BASE_URL}/reservations/me`)
      .flush([{ ...RESERVATION_PAYLOAD, state: 'IN_PROGRESS' }]);

    const [reservation] = await mine;

    expect(reservation.spaceName).toBe('Cancha de Tenis de Campo A');
    expect(reservation.images).toEqual(['https://cdn.univgo.test/court-a.jpg']);
    expect(reservation.state).toBe('inProgress');
  });

  it('tells a booking that expired from one the student gave up', async () => {
    const mine = new Promise<readonly Reservation[]>((resolve) =>
      repository.mine().subscribe(resolve),
    );

    controller.expectOne(`${API_BASE_URL}/reservations/me`).flush([
      { ...RESERVATION_PAYLOAD, id: 'r-expired', state: 'EXPIRED' },
      { ...RESERVATION_PAYLOAD, id: 'r-cancelled', state: 'CANCELLED' },
    ]);

    expect((await mine).map((entry) => entry.state)).toEqual(['expired', 'cancelled']);
  });

  it('says a booking is suspended, and which closure suspended it', async () => {
    const mine = new Promise<readonly Reservation[]>((resolve) =>
      repository.mine().subscribe(resolve),
    );

    controller
      .expectOne(`${API_BASE_URL}/reservations/me`)
      .flush([{ ...RESERVATION_PAYLOAD, state: 'SUSPENDED', closureReason: 'MAINTENANCE' }]);

    const [reservation] = await mine;

    expect(reservation.state).toBe('suspended');
    expect(reservation.closureReason).toBe('maintenance');
    expect(reservation.cancelledBy).toBeNull();
  });

  it('tells a booking the space cancelled from one the student gave up', async () => {
    const mine = new Promise<readonly Reservation[]>((resolve) =>
      repository.mine().subscribe(resolve),
    );

    controller.expectOne(`${API_BASE_URL}/reservations/me`).flush([
      { ...RESERVATION_PAYLOAD, state: 'CANCELLED', cancelledBy: 'ADMIN', closureReason: 'OTHER' },
      { ...RESERVATION_PAYLOAD, state: 'CANCELLED', cancelledBy: 'STUDENT' },
    ]);

    const [bySpace, byStudent] = await mine;

    expect([bySpace.cancelledBy, bySpace.closureReason]).toEqual(['admin', 'other']);
    expect([byStudent.cancelledBy, byStudent.closureReason]).toEqual(['student', null]);
  });

  it('answers with no booking at all for one that is missing, or belongs to somebody else', async () => {
    const found = new Promise<Reservation | null>((resolve) =>
      repository.findById('gone').subscribe(resolve),
    );

    controller
      .expectOne(`${API_BASE_URL}/reservations/gone`)
      .flush({ message: 'Reservation not found' }, { status: 404, statusText: 'Not Found' });

    expect(await found).toBeNull();
  });

  it('answers with the booking as it stands once it has been given up', async () => {
    const cancelled = new Promise<Reservation>((resolve) =>
      repository.cancel('r-1').subscribe(resolve),
    );

    controller
      .expectOne(`${API_BASE_URL}/reservations/r-1/cancel`)
      .flush({ ...RESERVATION_PAYLOAD, state: 'CANCELLED' });

    expect((await cancelled).state).toBe('cancelled');
  });
});
