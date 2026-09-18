import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { isAppError } from '../../../core/errors/app-error';
import { SKIP_ERROR_NOTIFICATION } from '../../../core/http/http-error.interceptor';
import {
  fromIsoDate,
  fromIsoDateTime,
  minutesFromIsoTime,
  toIsoTime,
} from '../../../shared/time/api-time';
import { toIsoDate } from '../../../shared/time/calendar-day';
import { closureReasonFromName } from '../../spaces/domain/closure-reason';
import type { Space } from '../../spaces/domain/space';
import { SpaceRepository } from '../../spaces/domain/space.repository';
import type { Canceller, Reservation, ReservationState } from '../domain/reservation';
import { type BookingRequest, ReservationRepository } from '../domain/reservation.repository';

interface ReservationDto {
  readonly id: string;
  readonly qrCodeData: string;
  readonly spaceId: string;
  readonly reservationDate: string;
  readonly blockStart: string;
  readonly blockEnd: string;
  readonly state: string;
  readonly checkInOpensAt: string;
  readonly checkInClosesAt: string;
  readonly cancelledBy: string | null;
  readonly closureReason: string | null;
}

/**
 * The server names states in its own vocabulary. Translating them here keeps that spelling out of
 * every view, and an unknown one lands in the state that promises the student the least rather than
 * hiding the booking.
 */
const STATES: Readonly<Record<string, ReservationState>> = {
  RESERVED: 'reserved',
  SUSPENDED: 'suspended',
  IN_PROGRESS: 'inProgress',
  FINISHED: 'finished',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

const CANCELLERS: Readonly<Record<string, Canceller>> = {
  STUDENT: 'student',
  ADMIN: 'admin',
};

/**
 * A booking whose space is missing from the catalogue cannot happen: the catalogue lists every
 * space there is, and a reservation holds a foreign key to one. This keeps the mapping total, not
 * a state the interface has to look good in.
 */
const UNKNOWN_SPACE: Space = {
  id: '',
  name: '',
  location: '',
  category: 'sports',
  capacity: 0,
  underMaintenance: false,
  opensOnDate: false,
  closedOnDate: false,
  freeSlots: [],
  images: [],
};

function toReservation(dto: ReservationDto, space: Space): Reservation {
  return {
    id: dto.id,
    code: dto.qrCodeData,
    spaceId: dto.spaceId,
    spaceName: space.name,
    location: space.location,
    category: space.category,
    images: space.images,
    date: fromIsoDate(dto.reservationDate),
    startMinutes: minutesFromIsoTime(dto.blockStart),
    endMinutes: minutesFromIsoTime(dto.blockEnd),
    state: STATES[dto.state] ?? 'finished',
    checkInOpensAt: fromIsoDateTime(dto.checkInOpensAt),
    checkInClosesAt: fromIsoDateTime(dto.checkInClosesAt),
    cancelledBy: dto.cancelledBy ? (CANCELLERS[dto.cancelledBy] ?? null) : null,
    closureReason: dto.closureReason ? closureReasonFromName(dto.closureReason) : null,
  };
}

/**
 * A reservation travels with the id of its space and nothing else, so its name, location and
 * category are read from the catalogue and joined here. The join belongs in the adapter — it is
 * the shape of the API, not a rule — which means a response that one day carries the space with it
 * changes this file alone.
 *
 * The catalogue is asked for today whatever day the booking falls on: it lists every space on any
 * date, and what varies with the date is which blocks are free, which is not what is read here.
 */
@Injectable()
export class HttpReservationRepository extends ReservationRepository {
  private readonly http = inject(HttpClient);
  private readonly spaces = inject(SpaceRepository);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/reservations`;

  /**
   * The refusals this can meet — the block filled up, it stopped being bookable, the student
   * already has one here today — all arrive as the same conflict, and none of them is answered by
   * "reload the page". The flow says what happened and sends the student back to the grid, so the
   * request opts out of the automatic alert.
   */
  create(request: BookingRequest): Observable<Reservation> {
    return this.withSpace(
      this.http.post<ReservationDto>(
        this.baseUrl,
        {
          spaceId: request.spaceId,
          reservationDate: toIsoDate(request.date),
          startTime: toIsoTime(request.startMinutes),
        },
        { context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) },
      ),
    );
  }

  mine(): Observable<readonly Reservation[]> {
    return forkJoin([
      this.http.get<readonly ReservationDto[]>(`${this.baseUrl}/me`),
      this.spaces.catalog(new Date()),
    ]).pipe(
      map(([reservations, spaces]) => {
        const directory = new Map(spaces.map((space) => [space.id, space]));

        return reservations.map((dto) =>
          toReservation(dto, directory.get(dto.spaceId) ?? UNKNOWN_SPACE),
        );
      }),
    );
  }

  /**
   * A booking that is not there is an answer, not a failure — a stale link, or one that belongs to
   * somebody else, which the server reports the same way on purpose. The view renders that case
   * itself, so the request opts out of the automatic alert; anything else stays a failure.
   */
  findById(id: string): Observable<Reservation | null> {
    return this.withSpace(
      this.http.get<ReservationDto>(`${this.baseUrl}/${id}`, {
        context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true),
      }),
    ).pipe(
      catchError((error: unknown) =>
        isAppError(error) && error.code === 'notFound' ? of(null) : throwError(() => error),
      ),
    );
  }

  cancel(id: string): Observable<Reservation> {
    return this.withSpace(this.http.post<ReservationDto>(`${this.baseUrl}/${id}/cancel`, {}));
  }

  private withSpace(response: Observable<ReservationDto>): Observable<Reservation> {
    return response.pipe(
      switchMap((dto) =>
        this.spaces
          .findById(dto.spaceId)
          .pipe(map((space) => toReservation(dto, space ?? UNKNOWN_SPACE))),
      ),
    );
  }
}
