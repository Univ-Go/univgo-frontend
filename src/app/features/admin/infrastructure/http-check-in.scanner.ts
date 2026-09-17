import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { fromIsoDateTime, minutesFromIsoTime, toIsoTime } from '../../../shared/time/api-time';
import type { ScanResult } from '../domain/check-in-scan';
import { CheckInScanner, type ScanRequest } from '../domain/check-in.scanner';

interface ScanResponseDto {
  readonly verdict: string;
  readonly studentName: string | null;
  readonly blockEnd: string | null;
  readonly opensAt: string | null;
  readonly expiredAt: string | null;
  readonly checkedInAt: string | null;
  readonly otherBlockStart: string | null;
  readonly otherBlockEnd: string | null;
}

/** The name is only ever absent on a verdict that does not name anybody; this keeps the type total. */
const UNNAMED = '';

function instant(value: string | null): Date | null {
  return value === null ? null : fromIsoDateTime(value);
}

function toResult(dto: ScanResponseDto): ScanResult {
  switch (dto.verdict) {
    case 'VALID':
      return {
        outcome: 'valid',
        studentName: dto.studentName ?? UNNAMED,
        blockEnd: instant(dto.blockEnd),
      };
    case 'TOO_EARLY':
      return { outcome: 'tooEarly', opensAt: instant(dto.opensAt) };
    case 'EXPIRED_ALREADY':
      return {
        outcome: 'expired',
        expiredAt: instant(dto.expiredAt),
      };
    case 'ALREADY_USED':
      return {
        outcome: 'alreadyUsed',
        studentName: dto.studentName ?? UNNAMED,
        checkedInAt: instant(dto.checkedInAt),
      };
    case 'OTHER_BLOCK':
      return {
        outcome: 'otherBlock',
        range:
          dto.otherBlockStart && dto.otherBlockEnd
            ? {
                startMinutes: minutesFromIsoTime(dto.otherBlockStart),
                endMinutes: minutesFromIsoTime(dto.otherBlockEnd),
              }
            : null,
      };
    // A code the system never issued, one whose reservation was cancelled, and a verdict this
    // version does not know all end the same way: there is nobody to let in.
    default:
      return { outcome: 'notFound' };
  }
}

/**
 * Every scan answers with a verdict and the status 200, failures included: the contract is a
 * decision at the door, not an error to handle. What can still fail is the request itself, and that
 * surfaces the usual way.
 */
@Injectable()
export class HttpCheckInScanner extends CheckInScanner {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(APP_CONFIG).apiBaseUrl}/admin/checkin/scan`;

  scan(request: ScanRequest): Observable<ScanResult> {
    return this.http
      .post<ScanResponseDto>(this.url, {
        code: request.code,
        expectedBlockStart: request.startMinutes === null ? null : toIsoTime(request.startMinutes),
        expectedBlockEnd: request.endMinutes === null ? null : toIsoTime(request.endMinutes),
      })
      .pipe(map(toResult));
  }
}
