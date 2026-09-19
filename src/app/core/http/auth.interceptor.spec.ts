import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { SessionStore } from '../../features/auth/application/session-store';
import type { AuthenticatedUser } from '../../features/auth/domain/session';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { authInterceptor } from './auth.interceptor';

const API_BASE_URL = 'http://localhost:3000';
// The session endpoints are proxied apart from the rest of the API, so they are not under
// `API_BASE_URL` and the interceptor has to recognise both bases.
const AUTH_BASE_URL = '/auth';
const PROTECTED_URL = `${API_BASE_URL}/reservations/me`;
const REFRESH_URL = `${AUTH_BASE_URL}/refresh`;

const USER: AuthenticatedUser = {
  id: 'f2e1',
  identification: '1234567890',
  email: 'sofia.ramirez@univgo.edu',
  firstName: 'Sofía',
  lastName: 'Ramírez',
  role: 'student',
};

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let renewal: Subject<AuthenticatedUser>;
  let renew: ReturnType<typeof vi.fn>;
  let expire: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    renewal = new Subject<AuthenticatedUser>();
    renew = vi.fn(() => renewal);
    expire = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: APP_CONFIG,
          useValue: { apiBaseUrl: API_BASE_URL, authBaseUrl: AUTH_BASE_URL } as AppConfig,
        },
        { provide: SessionStore, useValue: { renew, expire } },
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  function grantRenewal(): void {
    renewal.next(USER);
    renewal.complete();
  }

  it('sends cookies with API requests', () => {
    http.get(PROTECTED_URL).subscribe();

    expect(controller.expectOne(PROTECTED_URL).request.withCredentials).toBe(true);
  });

  it('sends cookies with the session endpoints, which sit outside the API base', () => {
    http.post(REFRESH_URL, null).subscribe();

    expect(controller.expectOne(REFRESH_URL).request.withCredentials).toBe(true);
  });

  it('leaves requests to other origins untouched', () => {
    http.get('/assets/icons.svg').subscribe();

    expect(controller.expectOne('/assets/icons.svg').request.withCredentials).toBe(false);
  });

  it('renews the session on a 401 and replays the request', async () => {
    const response = new Promise<unknown>((resolve) => http.get(PROTECTED_URL).subscribe(resolve));

    controller.expectOne(PROTECTED_URL).flush(null, { status: 401, statusText: 'Unauthorized' });
    grantRenewal();
    controller.expectOne(PROTECTED_URL).flush({ ok: true });

    expect(await response).toEqual({ ok: true });
    expect(renew).toHaveBeenCalledTimes(1);
    expect(expire).not.toHaveBeenCalled();
  });

  it('expires the session when the renewal itself is rejected', async () => {
    const failure = new Promise<unknown>((resolve) =>
      http.get(PROTECTED_URL).subscribe({ error: resolve }),
    );

    controller.expectOne(PROTECTED_URL).flush(null, { status: 401, statusText: 'Unauthorized' });
    renewal.error(new Error('refresh expired'));

    await failure;
    expect(expire).toHaveBeenCalledTimes(1);
  });

  it('never renews on the endpoints that mint the session, which would call itself', async () => {
    const failure = new Promise<unknown>((resolve) =>
      http.post(REFRESH_URL, null).subscribe({ error: resolve }),
    );

    controller.expectOne(REFRESH_URL).flush(null, { status: 401, statusText: 'Unauthorized' });

    await failure;
    expect(renew).not.toHaveBeenCalled();
  });

  it('gives up after one replay instead of looping', async () => {
    const failure = new Promise<unknown>((resolve) =>
      http.get(PROTECTED_URL).subscribe({ error: resolve }),
    );

    controller.expectOne(PROTECTED_URL).flush(null, { status: 401, statusText: 'Unauthorized' });
    grantRenewal();
    controller.expectOne(PROTECTED_URL).flush(null, { status: 401, statusText: 'Unauthorized' });

    await failure;
    expect(renew).toHaveBeenCalledTimes(1);
  });

  it('does not touch failures that are not about the session', async () => {
    const failure = new Promise<unknown>((resolve) =>
      http.get(PROTECTED_URL).subscribe({ error: resolve }),
    );

    controller.expectOne(PROTECTED_URL).flush(null, { status: 500, statusText: 'Server Error' });

    await failure;
    expect(renew).not.toHaveBeenCalled();
    expect(expire).not.toHaveBeenCalled();
  });
});
