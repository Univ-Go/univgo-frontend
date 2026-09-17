import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG, type AppConfig } from '../../../core/config/app-config';
import { AuthRepository } from '../domain/auth.repository';
import type { AuthenticatedUser } from '../domain/session';
import { HttpAuthRepository } from './http-auth.repository';

const API_BASE_URL = 'http://localhost:3000';

const SESSION_PAYLOAD = {
  id: 'f2e1',
  identification: '1234567890',
  email: 'sofia.ramirez@univgo.edu',
  firstName: 'Sofía',
  lastName: 'Ramírez',
  roles: ['STUDENT'],
};

describe('HttpAuthRepository', () => {
  let repository: AuthRepository;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { apiBaseUrl: API_BASE_URL } as AppConfig },
        { provide: AuthRepository, useClass: HttpAuthRepository },
      ],
    });

    repository = TestBed.inject(AuthRepository);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('maps the session payload onto the domain user, translating the role', async () => {
    const user = new Promise<AuthenticatedUser>((resolve) =>
      repository.signIn({ identifier: '1234567890', password: 'secret' }).subscribe(resolve),
    );

    const request = controller.expectOne(`${API_BASE_URL}/auth/login`);
    request.flush(SESSION_PAYLOAD);

    expect(await user).toEqual({
      id: 'f2e1',
      identification: '1234567890',
      email: 'sofia.ramirez@univgo.edu',
      firstName: 'Sofía',
      lastName: 'Ramírez',
      role: 'student',
    });
  });

  it('reads the current session from the endpoint that survives a reload', async () => {
    const user = new Promise<AuthenticatedUser>((resolve) =>
      repository.currentUser().subscribe(resolve),
    );

    controller.expectOne(`${API_BASE_URL}/auth/me`).flush({ ...SESSION_PAYLOAD, roles: ['ADMIN'] });

    expect((await user).role).toBe('admin');
  });

  it('renews and signs out without sending a body, since the cookies carry the credentials', () => {
    repository.renew().subscribe();
    repository.signOut().subscribe();

    expect(controller.expectOne(`${API_BASE_URL}/auth/refresh`).request.body).toBeNull();
    expect(controller.expectOne(`${API_BASE_URL}/auth/logout`).request.body).toBeNull();
  });
});
