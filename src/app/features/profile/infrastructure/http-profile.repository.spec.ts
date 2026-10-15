import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG, type AppConfig } from '../../../core/config/app-config';
import { SKIP_ERROR_NOTIFICATION } from '../../../core/http/http-error.interceptor';
import { ProfileRepository } from '../domain/profile.repository';
import { HttpProfileRepository } from './http-profile.repository';

const API_BASE_URL = 'http://localhost:3000';

describe('HttpProfileRepository', () => {
  let repository: ProfileRepository;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { apiBaseUrl: API_BASE_URL } as AppConfig },
        { provide: ProfileRepository, useClass: HttpProfileRepository },
      ],
    });

    repository = TestBed.inject(ProfileRepository);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('sends the three fields to the self-service endpoint and reports failures itself', async () => {
    const change = {
      currentPassword: 'old-secret',
      newPassword: 'new-secret',
      confirmation: 'new-secret',
    };
    const done = new Promise<void>((resolve) =>
      repository.changePassword(change).subscribe({ complete: resolve }),
    );

    const request = controller.expectOne(`${API_BASE_URL}/users/me/password`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(change);
    expect(request.request.context.get(SKIP_ERROR_NOTIFICATION)).toBe(true);
    request.flush(null, { status: 204, statusText: 'No Content' });

    await done;
  });
});
