import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, catchError, map, of, throwError } from 'rxjs';
import { isAppError } from '../../../core/errors/app-error';
import { SKIP_ERROR_NOTIFICATION } from '../../../core/http/http-error.interceptor';
import { APP_CONFIG } from '../../../core/config/app-config';
import { fromIsoDateTime, minutesFromIsoTime } from '../../../shared/time/api-time';
import { toIsoDate } from '../../../shared/time/calendar-day';
import { closureReasonFromName } from '../domain/closure-reason';
import { BOOKING_DURATION_MINUTES, type Space, categoryFromName } from '../domain/space';
import type { SpaceBlock } from '../domain/space-block';
import { blockerOf } from '../domain/space-block';
import { SpaceRepository } from '../domain/space.repository';

interface SpaceCatalogDto {
  readonly spaceId: string;
  readonly name: string;
  readonly location: string;
  readonly category: string;
  readonly capacity: number;
  readonly underMaintenance: boolean;
  readonly opensOnDate: boolean;
  readonly closedOnDate: boolean;
  /** Start of every block that still has a plaza on the requested day, as `HH:mm:ss`. */
  readonly freeBlockStarts: readonly string[];
  /**
   * Absent until the backend fills it in for a space (manually uploaded, no upload endpoint yet):
   * mapped to `[]` rather than trusting the field is always there.
   */
  readonly images?: readonly string[];
  readonly description: string;
  readonly rules: readonly string[];
}

interface BlockAvailabilityDto {
  readonly start: string;
  readonly end: string;
  readonly capacity: number;
  readonly free: number;
  readonly offered: boolean;
  readonly alreadyReservedByUserToday: boolean;
  readonly overlapsUserReservation: boolean;
  readonly closed: boolean;
  readonly closureReason: string | null;
  /** The check-in window the student would get by reserving this block right now. */
  readonly previewCheckInOpensAt: string;
  readonly previewCheckInClosesAt: string;
}

/**
 * The catalogue reports the blocks that can still be booked; the domain reads windows. One block is
 * one window of the institution's fixed length, which is what `docs/booking-flow.md` §14 means by
 * opening hours ceasing to be continuous ranges.
 */
function toSpace(dto: SpaceCatalogDto, date: Date): Space {
  return {
    id: dto.spaceId,
    name: dto.name,
    location: dto.location,
    category: categoryFromName(dto.category),
    capacity: dto.capacity,
    underMaintenance: dto.underMaintenance,
    opensOnDate: dto.opensOnDate,
    closedOnDate: dto.closedOnDate,
    freeSlots: dto.freeBlockStarts.map((start) => ({
      date,
      from: minutesFromIsoTime(start),
      to: minutesFromIsoTime(start) + BOOKING_DURATION_MINUTES,
    })),
    images: dto.images ?? [],
    description: dto.description,
    rules: dto.rules,
  };
}

function toBlock(dto: BlockAvailabilityDto): SpaceBlock {
  return {
    startMinutes: minutesFromIsoTime(dto.start),
    endMinutes: minutesFromIsoTime(dto.end),
    capacity: dto.capacity,
    free: dto.free,
    checkInOpensAt: fromIsoDateTime(dto.previewCheckInOpensAt),
    checkInClosesAt: fromIsoDateTime(dto.previewCheckInClosesAt),
    blocker: blockerOf({
      offered: dto.offered,
      free: dto.free,
      alreadyBookedToday: dto.alreadyReservedByUserToday,
      overlapsAnother: dto.overlapsUserReservation,
      closed: dto.closed,
    }),
    closureReason: dto.closureReason ? closureReasonFromName(dto.closureReason) : null,
  };
}

@Injectable()
export class HttpSpaceRepository extends SpaceRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/spaces`;

  catalog(date: Date): Observable<readonly Space[]> {
    return this.http
      .get<readonly SpaceCatalogDto[]>(this.baseUrl, { params: { date: toIsoDate(date) } })
      .pipe(map((spaces) => spaces.map((dto) => toSpace(dto, date))));
  }

  /**
   * `date` is what the day-dependent half of the answer describes — free blocks, whether the space
   * opens, whether it is shut. A caller that only needs the space's own facts can leave it out and
   * read today's, which is what the booking flow does: it picks the day a step later.
   *
   * A space that is not there is an answer, not a failure — a stale link — so the request opts out
   * of the automatic alert and the view says it in its own words. Anything else stays a failure.
   */
  findById(id: string, date = new Date()): Observable<Space | null> {
    return this.http
      .get<SpaceCatalogDto>(`${this.baseUrl}/${id}`, {
        params: { date: toIsoDate(date) },
        context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true),
      })
      .pipe(
        map((dto) => toSpace(dto, date)),
        catchError((error: unknown) =>
          isAppError(error) && error.code === 'notFound' ? of(null) : throwError(() => error),
        ),
      );
  }

  availability(spaceId: string, date: Date): Observable<readonly SpaceBlock[]> {
    return this.http
      .get<readonly BlockAvailabilityDto[]>(`${this.baseUrl}/${spaceId}/availability`, {
        params: { date: toIsoDate(date) },
      })
      .pipe(map((blocks) => blocks.map(toBlock)));
  }
}
