import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG, type AppConfig } from '../../../core/config/app-config';
import { AdminSpaceRepository } from '../domain/admin-space.repository';
import { HttpAdminSpaceRepository } from './http-admin-space.repository';

const API_BASE_URL = 'http://localhost:3000';

const SPACE_ID = 'f2e1';

describe('HttpAdminSpaceRepository', () => {
  let repository: AdminSpaceRepository;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { apiBaseUrl: API_BASE_URL } as AppConfig },
        { provide: AdminSpaceRepository, useClass: HttpAdminSpaceRepository },
      ],
    });

    repository = TestBed.inject(AdminSpaceRepository);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('takes a space out of service, and puts it back, through the same flag', () => {
    repository.setMaintenance(SPACE_ID, true).subscribe();

    const closing = controller.expectOne(`${API_BASE_URL}/admin/spaces/${SPACE_ID}/maintenance`);

    expect(closing.request.method).toBe('PUT');
    expect(closing.request.body).toEqual({ underMaintenance: true });
    closing.flush(null);

    repository.setMaintenance(SPACE_ID, false).subscribe();

    const opening = controller.expectOne(`${API_BASE_URL}/admin/spaces/${SPACE_ID}/maintenance`);

    expect(opening.request.body).toEqual({ underMaintenance: false });
    opening.flush(null);
  });

  it('answers how many bookings stopped holding a place', async () => {
    const cancelled = new Promise<number>((resolve) =>
      repository.cancelAllReservations(SPACE_ID).subscribe(resolve),
    );

    controller
      .expectOne(`${API_BASE_URL}/admin/spaces/${SPACE_ID}/reservations/cancel-all`)
      .flush({ cancelledCount: 3 });

    expect(await cancelled).toBe(3);
  });
});
