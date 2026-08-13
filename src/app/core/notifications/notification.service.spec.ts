import { TestBed } from '@angular/core/testing';
import { MessageService, type ToastMessageOptions } from 'primeng/api';
import { createAppError } from '../errors/app-error';
import { resolveErrorMessage } from '../errors/error-message.resolver';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let add: ReturnType<typeof vi.fn<(message: ToastMessageOptions) => void>>;
  let service: NotificationService;

  beforeEach(() => {
    add = vi.fn<(message: ToastMessageOptions) => void>();

    TestBed.configureTestingModule({
      providers: [{ provide: MessageService, useValue: { add } }],
    });

    service = TestBed.inject(NotificationService);
  });

  it('renders an error as its translated wording, not its code', () => {
    service.error(createAppError('network'));

    const message = add.mock.calls[0][0];
    expect(message.severity).toBe('error');
    expect(message.summary).toBe(resolveErrorMessage('network').summary);
    expect(message.detail).toBe(resolveErrorMessage('network').detail);
    expect(JSON.stringify(message)).not.toContain('network');
  });

  it('appends the support reference when the backend supplied one', () => {
    service.error(createAppError('server', 'abc-123'));

    expect(add.mock.calls[0][0].detail).toContain('abc-123');
  });

  it('keeps errors on screen longer than routine feedback', () => {
    service.success('Guardado');
    service.error(createAppError('server'));

    const [successMessage] = add.mock.calls[0];
    const [errorMessage] = add.mock.calls[1];
    expect(errorMessage.life ?? 0).toBeGreaterThan(successMessage.life ?? 0);
  });

  it.each(['success', 'info', 'warn'] as const)('sends %s feedback with its severity', (kind) => {
    service[kind]('Título', 'Detalle');

    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: kind, summary: 'Título', detail: 'Detalle' }),
    );
  });
});
