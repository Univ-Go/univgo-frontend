import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { type AppError, isAppError } from '../errors/app-error';
import { Logger } from '../logging/logger';
import { NotificationService } from '../notifications/notification.service';
import { SKIP_ERROR_NOTIFICATION, httpErrorInterceptor } from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let notifyError: ReturnType<typeof vi.fn<(error: AppError) => void>>;
  let logError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    notifyError = vi.fn<(error: AppError) => void>();
    logError = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: { error: notifyError } },
        { provide: Logger, useValue: { error: logError, warn: vi.fn() } },
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('replaces the transport failure with an AppError before it reaches the caller', async () => {
    const failure = new Promise<unknown>((resolve) =>
      http.get('/api/spaces').subscribe({ error: resolve }),
    );

    controller.expectOne('/api/spaces').flush('<html>Internal Server Error</html>', {
      status: 500,
      statusText: 'Internal Server Error',
    });

    const error = await failure;
    expect(isAppError(error)).toBe(true);
    expect((error as AppError).code).toBe('server');
    expect(JSON.stringify(error)).not.toContain('Internal Server Error');
  });

  it('notifies the user by default', async () => {
    const failure = new Promise((resolve) => http.get('/api/spaces').subscribe({ error: resolve }));
    controller.expectOne('/api/spaces').flush(null, { status: 503, statusText: 'Unavailable' });
    await failure;

    expect(notifyError).toHaveBeenCalledWith(expect.objectContaining({ code: 'server' }));
  });

  it('stays silent when the caller renders the failure itself', async () => {
    const context = new HttpContext().set(SKIP_ERROR_NOTIFICATION, true);
    const failure = new Promise((resolve) =>
      http.get('/api/spaces', { context }).subscribe({ error: resolve }),
    );
    controller.expectOne('/api/spaces').flush(null, { status: 409, statusText: 'Conflict' });
    await failure;

    expect(notifyError).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalled();
  });

  it('logs for diagnosis without recording the query string', async () => {
    const failure = new Promise((resolve) =>
      http.get('/api/spaces', { params: { token: 'secret-value' } }).subscribe({ error: resolve }),
    );
    controller
      .expectOne((request) => request.url === '/api/spaces')
      .flush(null, {
        status: 500,
        statusText: 'Server Error',
      });
    await failure;

    const [message, context] = logError.mock.calls[0] as [string, Record<string, unknown>];
    expect(message).toBeTruthy();
    expect(context['status']).toBe(500);
    expect(JSON.stringify(context)).not.toContain('secret-value');
  });
});
