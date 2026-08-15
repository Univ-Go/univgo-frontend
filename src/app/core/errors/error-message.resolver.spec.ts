import type { AppErrorCode } from './app-error';
import { resolveErrorMessage } from './error-message.resolver';

const ALL_CODES: readonly AppErrorCode[] = [
  'network',
  'unauthorized',
  'forbidden',
  'notFound',
  'conflict',
  'validation',
  'rateLimited',
  'server',
  'unknown',
];

describe('resolveErrorMessage', () => {
  it.each(ALL_CODES)('returns wording a user can read for "%s"', (code) => {
    const { summary, detail } = resolveErrorMessage(code);

    expect(summary.trim()).not.toBe('');
    expect(detail.trim()).not.toBe('');
  });

  it.each(ALL_CODES)('never leaks technical wording for "%s"', (code) => {
    const { summary, detail } = resolveErrorMessage(code);
    const text = `${summary} ${detail}`;

    expect(text).not.toMatch(/HTTP|status|\b[45]\d{2}\b|Error:|undefined|null/i);
  });

  it('distinguishes a recoverable conflict from an outright failure', () => {
    expect(resolveErrorMessage('conflict').detail).not.toBe(resolveErrorMessage('server').detail);
  });
});
