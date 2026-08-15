import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { mapHttpStatusToErrorCode, readErrorReference } from './http-error.mapper';

describe('mapHttpStatusToErrorCode', () => {
  it('reports a status of 0 as a network failure', () => {
    expect(mapHttpStatusToErrorCode(0)).toBe('network');
  });

  it.each([
    [400, 'validation'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'notFound'],
    [409, 'conflict'],
    [422, 'validation'],
    [429, 'rateLimited'],
  ])('maps status %i to "%s"', (status, expected) => {
    expect(mapHttpStatusToErrorCode(status)).toBe(expected);
  });

  it.each([500, 502, 503, 504])('treats status %i as a server failure', (status) => {
    expect(mapHttpStatusToErrorCode(status)).toBe('server');
  });

  it('falls back to unknown for client statuses it does not recognise', () => {
    expect(mapHttpStatusToErrorCode(418)).toBe('unknown');
  });
});

describe('readErrorReference', () => {
  it('returns the correlation id when the backend sends one', () => {
    const response = new HttpErrorResponse({
      status: 500,
      headers: new HttpHeaders({ 'X-Correlation-Id': 'abc-123' }),
    });

    expect(readErrorReference(response)).toBe('abc-123');
  });

  it('returns undefined when the header is absent', () => {
    const response = new HttpErrorResponse({ status: 500 });

    expect(readErrorReference(response)).toBeUndefined();
  });
});
