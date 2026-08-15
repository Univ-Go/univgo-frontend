import { TestBed } from '@angular/core/testing';
import { TuiNotificationService, type TuiNotificationOptions } from '@taiga-ui/core';
import { EMPTY, type Observable } from 'rxjs';
import { createAppError } from '../errors/app-error';
import { resolveErrorMessage } from '../errors/error-message.resolver';
import { NotificationService } from './notification.service';

type Open = (
  content: unknown,
  options: Partial<TuiNotificationOptions>,
) => Observable<Partial<TuiNotificationOptions>>;

describe('NotificationService', () => {
  let open: ReturnType<typeof vi.fn<Open>>;
  let service: NotificationService;

  beforeEach(() => {
    open = vi.fn<Open>(() => EMPTY);

    TestBed.configureTestingModule({
      providers: [{ provide: TuiNotificationService, useValue: { open } }],
    });

    service = TestBed.inject(NotificationService);
  });

  it('renders an error as its translated wording, not its code', () => {
    service.error(createAppError('network'));

    const [content, options] = open.mock.calls[0];
    expect(options.appearance).toBe('negative');
    expect(options.label).toBe(resolveErrorMessage('network').summary);
    expect(content).toBe(resolveErrorMessage('network').detail);
    expect(JSON.stringify([content, options])).not.toContain('network');
  });

  it('appends the support reference when the backend supplied one', () => {
    service.error(createAppError('server', 'abc-123'));

    expect(open.mock.calls[0][0]).toContain('abc-123');
  });

  it('keeps errors on screen longer than routine feedback', () => {
    service.success('Guardado', 'Los cambios ya están disponibles');
    service.error(createAppError('server'));

    const [, success] = open.mock.calls[0];
    const [, failure] = open.mock.calls[1];
    expect(Number(failure.autoClose)).toBeGreaterThan(Number(success.autoClose));
  });

  it.each([
    ['success', 'positive'],
    ['info', 'info'],
    ['warn', 'warning'],
  ] as const)('sends %s feedback as a %s alert', (kind, appearance) => {
    service[kind]('Título', 'Detalle');

    expect(open).toHaveBeenCalledWith(
      'Detalle',
      expect.objectContaining({ appearance, label: 'Título' }),
    );
  });

  it('shows a summary without detail as a single line instead of an empty body', () => {
    service.info('Sin detalle');

    expect(open).toHaveBeenCalledWith('Sin detalle', expect.objectContaining({ label: '' }));
  });
});
