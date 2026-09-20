import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG, type AppConfig } from '../../../core/config/app-config';
import { httpErrorInterceptor } from '../../../core/http/http-error.interceptor';
import { Logger } from '../../../core/logging/logger';
import { NotificationService } from '../../../core/notifications/notification.service';
import type { Space } from '../domain/space';
import type { SpaceBlock } from '../domain/space-block';
import { SpaceRepository } from '../domain/space.repository';
import { HttpSpaceRepository } from './http-space.repository';

const API_BASE_URL = 'http://localhost:3000';

const DATE = new Date(2026, 8, 17);

const CATALOG_PAYLOAD = [
  {
    spaceId: 'f2e1',
    name: 'Cancha de Tenis de Campo A',
    location: 'Complejo Deportivo Central',
    category: 'SPORTS',
    capacity: 4,
    underMaintenance: false,
    opensOnDate: true,
    closedOnDate: false,
    freeBlockStarts: ['06:00:00', '14:00:00'],
    description: 'Cancha de tenis de campo en superficie dura.',
    rules: ['Usa calzado de tenis de suela lisa.'],
  },
];

const [SPACE_PAYLOAD] = CATALOG_PAYLOAD;

describe('HttpSpaceRepository', () => {
  let repository: SpaceRepository;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // The interceptor is what turns a failed request into an `AppError`, and `findById` reads
        // that vocabulary to tell a stale link from a failure. Without it here the adapter would be
        // tested against a transport error it never sees in the application.
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: { error: vi.fn() } },
        { provide: Logger, useValue: { error: vi.fn(), warn: vi.fn() } },
        { provide: APP_CONFIG, useValue: { apiBaseUrl: API_BASE_URL } as AppConfig },
        { provide: SpaceRepository, useClass: HttpSpaceRepository },
      ],
    });

    repository = TestBed.inject(SpaceRepository);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('asks for the day in the user calendar rather than in UTC', () => {
    repository.catalog(new Date(2026, 0, 5)).subscribe();

    const request = controller.expectOne((candidate) => candidate.url === `${API_BASE_URL}/spaces`);

    expect(request.request.params.get('date')).toBe('2026-01-05');
    request.flush([]);
  });

  it('turns every free block into a window of one booking, translating the category', async () => {
    const spaces = new Promise<readonly Space[]>((resolve) =>
      repository.catalog(DATE).subscribe(resolve),
    );

    controller
      .expectOne((candidate) => candidate.url === `${API_BASE_URL}/spaces`)
      .flush(CATALOG_PAYLOAD);

    expect(await spaces).toEqual([
      {
        id: 'f2e1',
        name: 'Cancha de Tenis de Campo A',
        location: 'Complejo Deportivo Central',
        category: 'sports',
        capacity: 4,
        underMaintenance: false,
        opensOnDate: true,
        closedOnDate: false,
        freeSlots: [
          { date: DATE, from: 360, to: 480 },
          { date: DATE, from: 840, to: 960 },
        ],
        images: [],
        description: 'Cancha de tenis de campo en superficie dura.',
        rules: ['Usa calzado de tenis de suela lisa.'],
      },
    ]);
  });

  it('reads one space for the day asked about, with what it says about itself', async () => {
    const space = new Promise<Space | null>((resolve) =>
      repository.findById('f2e1', DATE).subscribe(resolve),
    );

    const request = controller.expectOne(
      (candidate) => candidate.url === `${API_BASE_URL}/spaces/f2e1`,
    );

    expect(request.request.params.get('date')).toBe('2026-09-17');
    request.flush(SPACE_PAYLOAD);

    expect(await space).toMatchObject({
      id: 'f2e1',
      description: 'Cancha de tenis de campo en superficie dura.',
      rules: ['Usa calzado de tenis de suela lisa.'],
      freeSlots: [
        { date: DATE, from: 360, to: 480 },
        { date: DATE, from: 840, to: 960 },
      ],
    });
  });

  it('answers with no space at all when the id is not in the catalogue', async () => {
    const space = new Promise<Space | null>((resolve) =>
      repository.findById('gone').subscribe(resolve),
    );

    controller
      .expectOne((candidate) => candidate.url === `${API_BASE_URL}/spaces/gone`)
      .flush('', { status: 404, statusText: 'Not Found' });

    expect(await space).toBeNull();
  });

  it('reads every block of the day, saying why the ones on hold are on hold', async () => {
    const blocks = new Promise<readonly SpaceBlock[]>((resolve) =>
      repository.availability('f2e1', DATE).subscribe(resolve),
    );

    controller
      .expectOne((candidate) => candidate.url === `${API_BASE_URL}/spaces/f2e1/availability`)
      .flush([
        {
          start: '14:00:00',
          end: '16:00:00',
          capacity: 4,
          free: 2,
          offered: true,
          alreadyReservedByUserToday: false,
          overlapsUserReservation: false,
          closed: false,
          closureReason: null,
          previewCheckInOpensAt: '2026-09-17T13:45:00',
          previewCheckInClosesAt: '2026-09-17T14:15:00',
        },
        {
          start: '16:00:00',
          end: '18:00:00',
          capacity: 4,
          free: 0,
          offered: false,
          alreadyReservedByUserToday: false,
          overlapsUserReservation: false,
          closed: true,
          closureReason: 'MAINTENANCE',
          previewCheckInOpensAt: '2026-09-17T15:45:00',
          previewCheckInClosesAt: '2026-09-17T16:15:00',
        },
      ]);

    expect(await blocks).toEqual([
      {
        startMinutes: 840,
        endMinutes: 960,
        capacity: 4,
        free: 2,
        checkInOpensAt: new Date(2026, 8, 17, 13, 45),
        checkInClosesAt: new Date(2026, 8, 17, 14, 15),
        blocker: null,
        closureReason: null,
      },
      {
        startMinutes: 960,
        endMinutes: 1080,
        capacity: 4,
        free: 0,
        checkInOpensAt: new Date(2026, 8, 17, 15, 45),
        checkInClosesAt: new Date(2026, 8, 17, 16, 15),
        blocker: 'closed',
        closureReason: 'maintenance',
      },
    ]);
  });
});
