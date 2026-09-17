import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG, type AppConfig } from '../../../core/config/app-config';
import type { ScanResult } from '../domain/check-in-scan';
import { CheckInScanner } from '../domain/check-in.scanner';
import { HttpCheckInScanner } from './http-check-in.scanner';

const API_BASE_URL = 'http://localhost:3000';

const SCAN_URL = `${API_BASE_URL}/admin/checkin/scan`;

const EMPTY_VERDICT = {
  studentName: null,
  blockEnd: null,
  opensAt: null,
  expiredAt: null,
  checkedInAt: null,
  otherBlockStart: null,
  otherBlockEnd: null,
};

describe('HttpCheckInScanner', () => {
  let scanner: CheckInScanner;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { apiBaseUrl: API_BASE_URL } as AppConfig },
        { provide: CheckInScanner, useClass: HttpCheckInScanner },
      ],
    });

    scanner = TestBed.inject(CheckInScanner);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  function scan(startMinutes: number | null = 840, endMinutes: number | null = 960) {
    const result = new Promise<ScanResult>((resolve) =>
      scanner.scan({ code: 'a0f3', startMinutes, endMinutes }).subscribe(resolve),
    );

    return { result, request: controller.expectOne(SCAN_URL) };
  }

  it('sends the block the administrator is checking people into', () => {
    const { request } = scan();

    expect(request.request.body).toEqual({
      code: 'a0f3',
      expectedBlockStart: '14:00:00',
      expectedBlockEnd: '16:00:00',
    });
    request.flush({ verdict: 'NOT_EXISTS', ...EMPTY_VERDICT });
  });

  it('leaves the block out when none is in progress, so the reservation decides alone', () => {
    const { request } = scan(null, null);

    expect(request.request.body).toEqual({
      code: 'a0f3',
      expectedBlockStart: null,
      expectedBlockEnd: null,
    });
    request.flush({ verdict: 'NOT_EXISTS', ...EMPTY_VERDICT });
  });

  it('reads a granted access with the name and the hour it runs until', async () => {
    const { result, request } = scan();

    request.flush({
      verdict: 'VALID',
      ...EMPTY_VERDICT,
      studentName: 'John Edit',
      blockEnd: '2026-09-17T16:00:00',
    });

    expect(await result).toEqual({
      outcome: 'valid',
      studentName: 'John Edit',
      blockEnd: new Date(2026, 8, 17, 16, 0),
    });
  });

  it('reads the four refusals in the vocabulary each one needs', async () => {
    const early = scan();
    early.request.flush({ verdict: 'TOO_EARLY', ...EMPTY_VERDICT, opensAt: '2026-09-17T13:45:00' });
    expect(await early.result).toEqual({
      outcome: 'tooEarly',
      opensAt: new Date(2026, 8, 17, 13, 45),
    });

    const expired = scan();
    expired.request.flush({
      verdict: 'EXPIRED_ALREADY',
      ...EMPTY_VERDICT,
      expiredAt: '2026-09-17T14:15:00',
    });
    expect(await expired.result).toEqual({
      outcome: 'expired',
      expiredAt: new Date(2026, 8, 17, 14, 15),
    });

    const used = scan();
    used.request.flush({
      verdict: 'ALREADY_USED',
      ...EMPTY_VERDICT,
      studentName: 'John Edit',
      checkedInAt: '2026-09-17T14:02:00',
    });
    expect(await used.result).toEqual({
      outcome: 'alreadyUsed',
      studentName: 'John Edit',
      checkedInAt: new Date(2026, 8, 17, 14, 2),
    });

    const elsewhere = scan();
    elsewhere.request.flush({
      verdict: 'OTHER_BLOCK',
      ...EMPTY_VERDICT,
      otherBlockStart: '16:00:00',
      otherBlockEnd: '18:00:00',
    });
    expect(await elsewhere.result).toEqual({
      outcome: 'otherBlock',
      range: { startMinutes: 960, endMinutes: 1080 },
    });
  });

  it('answers with nobody to let in for a verdict it does not know', async () => {
    const { result, request } = scan();

    request.flush({ verdict: 'SOMETHING_NEW', ...EMPTY_VERDICT });

    expect(await result).toEqual({ outcome: 'notFound' });
  });
});
