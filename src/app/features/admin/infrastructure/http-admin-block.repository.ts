import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, catchError, map, of, throwError } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { isAppError } from '../../../core/errors/app-error';
import { SKIP_ERROR_NOTIFICATION } from '../../../core/http/http-error.interceptor';
import { fromIsoDateTime, minutesFromIsoTime, toIsoTime } from '../../../shared/time/api-time';
import { toIsoDate } from '../../../shared/time/calendar-day';
import { minutesOfDay } from '../../../shared/time/time-of-day';
import type { ReservationState } from '../../my-reservations/domain/reservation';
import { closureReasonFromName } from '../../spaces/domain/closure-reason';
import { AdminBlockRepository } from '../domain/admin-block.repository';
import type { AdminBlock, AdminBlockDetail, Attendee } from '../domain/attendance';

interface BlockSummaryDto {
  readonly start: string;
  readonly end: string;
  readonly capacity: number;
  readonly occupied: number;
  readonly free: number;
  readonly closed: boolean;
  readonly closureReason: string | null;
}

interface OccupantDto {
  readonly studentName: string;
  readonly document: string | null;
  readonly school: string | null;
  readonly state: string;
  readonly checkedInAt: string | null;
}

interface BlockDetailDto extends BlockSummaryDto {
  readonly roster: readonly OccupantDto[];
}

/** The same vocabulary the student's own reservations arrive in, read the same way. */
const STATES: Readonly<Record<string, ReservationState>> = {
  RESERVED: 'reserved',
  SUSPENDED: 'suspended',
  IN_PROGRESS: 'inProgress',
  FINISHED: 'finished',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

/**
 * A student whose record has no document or school on file still belongs on the list: the desk can
 * check them in by name, and an empty cell says "not on record" where a missing row would say
 * "not booked".
 */
const UNKNOWN = '';

/** The server answers a block by its hours; the panel reads instants on the day it asked about. */
function at(day: Date, time: string): Date {
  const instant = new Date(day);

  instant.setHours(0, minutesFromIsoTime(time), 0, 0);

  return instant;
}

function toBlock(dto: BlockSummaryDto, day: Date): AdminBlock {
  return {
    start: at(day, dto.start),
    end: at(day, dto.end),
    capacity: dto.capacity,
    occupied: dto.occupied,
    free: dto.free,
    closed: dto.closed,
    closureReason: dto.closureReason ? closureReasonFromName(dto.closureReason) : null,
  };
}

function toAttendee(dto: OccupantDto): Attendee {
  return {
    name: dto.studentName,
    document: dto.document ?? UNKNOWN,
    school: dto.school ?? UNKNOWN,
    state: STATES[dto.state] ?? 'finished',
    checkedInAt: dto.checkedInAt ? fromIsoDateTime(dto.checkedInAt) : null,
  };
}

@Injectable()
export class HttpAdminBlockRepository extends AdminBlockRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/admin/spaces`;

  blocksOf(spaceId: string, date: Date): Observable<readonly AdminBlock[]> {
    return this.http
      .get<readonly BlockSummaryDto[]>(`${this.baseUrl}/${spaceId}/blocks`, {
        params: { date: toIsoDate(date) },
      })
      .pipe(map((blocks) => blocks.map((dto) => toBlock(dto, date))));
  }

  /**
   * A block that is not on the space's schedule comes back as a not-found, which the view renders
   * itself, so the request opts out of the automatic alert and reports everything else as a
   * failure.
   */
  blockDetail(spaceId: string, date: Date, start: Date): Observable<AdminBlockDetail | null> {
    return this.http
      .get<BlockDetailDto>(`${this.baseUrl}/${spaceId}/blocks/${toIsoTime(minutesOfDay(start))}`, {
        params: { date: toIsoDate(date) },
        context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true),
      })
      .pipe(
        map((dto) => ({ ...toBlock(dto, date), attendees: dto.roster.map(toAttendee) })),
        catchError((error: unknown) =>
          isAppError(error) && error.code === 'notFound' ? of(null) : throwError(() => error),
        ),
      );
  }
}
