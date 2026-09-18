import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';
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
  /** Start of every block that still has a plaza on the requested day, as `HH:mm:ss`. */
  readonly freeBlockStarts: readonly string[];
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
    freeSlots: dto.freeBlockStarts.map((start) => ({
      date,
      from: minutesFromIsoTime(start),
      to: minutesFromIsoTime(start) + BOOKING_DURATION_MINUTES,
    })),
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
   * Read out of today's catalogue because the server has no endpoint for one space yet. The
   * shortcut stays here rather than in the caller: when that endpoint exists this is the only
   * method that changes.
   */
  findById(id: string): Observable<Space | null> {
    return this.catalog(new Date()).pipe(
      map((spaces) => spaces.find((space) => space.id === id) ?? null),
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
