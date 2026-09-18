import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG, type AppConfig } from '../../../core/config/app-config';
import { httpErrorInterceptor } from '../../../core/http/http-error.interceptor';
import { Logger } from '../../../core/logging/logger';
import { NotificationService } from '../../../core/notifications/notification.service';
import { AdminBlockRepository } from '../domain/admin-block.repository';
import type { AdminBlock, AdminBlockDetail } from '../domain/attendance';
import { HttpAdminBlockRepository } from './http-admin-block.repository';

const API_BASE_URL = 'http://localhost:3000';

const SPACE_ID = 'f2e1';

const DAY = new Date(2026, 8, 17);

describe('HttpAdminBlockRepository', () => {
  let repository: AdminBlockRepository;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // The detail tells "that block is not on the schedule" from a failed read through the
        // `AppError` the interceptor maps, so the interceptor is part of what is under test.
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: { error: vi.fn() } },
        { provide: Logger, useValue: { error: vi.fn(), warn: vi.fn() } },
        { provide: APP_CONFIG, useValue: { apiBaseUrl: API_BASE_URL } as AppConfig },
        { provide: AdminBlockRepository, useClass: HttpAdminBlockRepository },
      ],
    });

    repository = TestBed.inject(AdminBlockRepository);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('reads the day as instants on the day it asked about, not as clock strings', async () => {
    const blocks = new Promise<readonly AdminBlock[]>((resolve) =>
      repository.blocksOf(SPACE_ID, DAY).subscribe(resolve),
    );

    const request = controller.expectOne(
      (candidate) => candidate.url === `${API_BASE_URL}/admin/spaces/${SPACE_ID}/blocks`,
    );

    expect(request.request.params.get('date')).toBe('2026-09-17');
    request.flush([
      {
        start: '14:00:00',
        end: '16:00:00',
        capacity: 10,
        occupied: 4,
        free: 6,
        closed: false,
        closureReason: null,
      },
      {
        start: '16:00:00',
        end: '18:00:00',
        capacity: 10,
        occupied: 0,
        free: 10,
        closed: true,
        closureReason: 'MAINTENANCE',
      },
    ]);

    expect(await blocks).toEqual([
      {
        start: new Date(2026, 8, 17, 14, 0),
        end: new Date(2026, 8, 17, 16, 0),
        capacity: 10,
        occupied: 4,
        free: 6,
        closed: false,
        closureReason: null,
      },
      {
        start: new Date(2026, 8, 17, 16, 0),
        end: new Date(2026, 8, 17, 18, 0),
        capacity: 10,
        occupied: 0,
        free: 10,
        closed: true,
        closureReason: 'maintenance',
      },
    ]);
  });

  it('asks for one block by its hour and answers with who is in it', async () => {
    const detail = new Promise<AdminBlockDetail | null>((resolve) =>
      repository.blockDetail(SPACE_ID, DAY, new Date(2026, 8, 17, 14, 0)).subscribe(resolve),
    );

    const request = controller.expectOne(
      (candidate) => candidate.url === `${API_BASE_URL}/admin/spaces/${SPACE_ID}/blocks/14:00:00`,
    );

    expect(request.request.params.get('date')).toBe('2026-09-17');
    request.flush({
      start: '14:00:00',
      end: '16:00:00',
      capacity: 10,
      occupied: 2,
      free: 8,
      closed: false,
      closureReason: null,
      roster: [
        {
          studentName: 'John Edit',
          document: '1234567890',
          school: 'Ingeniería',
          state: 'IN_PROGRESS',
          checkedInAt: '2026-09-17T14:02:00',
        },
        {
          studentName: 'Ana Ruiz',
          document: null,
          school: null,
          state: 'RESERVED',
          checkedInAt: null,
        },
      ],
    });

    const block = await detail;

    expect(block?.occupied).toBe(2);
    expect(block?.attendees).toEqual([
      {
        name: 'John Edit',
        document: '1234567890',
        school: 'Ingeniería',
        state: 'inProgress',
        checkedInAt: new Date(2026, 8, 17, 14, 2),
      },
      {
        name: 'Ana Ruiz',
        document: '',
        school: '',
        state: 'reserved',
        checkedInAt: null,
      },
    ]);
  });

  it('answers with no block at all for an hour the space does not run', async () => {
    const detail = new Promise<AdminBlockDetail | null>((resolve) =>
      repository.blockDetail(SPACE_ID, DAY, new Date(2026, 8, 17, 3, 0)).subscribe(resolve),
    );

    controller
      .expectOne((candidate) => candidate.url.endsWith('/blocks/03:00:00'))
      .flush({ message: 'Space not found' }, { status: 404, statusText: 'Not Found' });

    expect(await detail).toBeNull();
  });
});
