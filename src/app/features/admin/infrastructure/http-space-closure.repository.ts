import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { fromIsoDateTime, toIsoDateTime } from '../../../shared/time/api-time';
import type { ClosureReason, SpaceClosure } from '../domain/space-closure';
import { type ClosureRequest, SpaceClosureRepository } from '../domain/space-closure.repository';

interface ClosureDto {
  readonly id: string;
  readonly spaceId: string;
  readonly startsAt: string;
  readonly endsAt: string | null;
  readonly reason: string;
  readonly details: string | null;
  readonly createdAt: string;
  readonly revertedAt: string | null;
}

/** The server names reasons in upper case; an unknown one lands in the widest bucket. */
const REASONS: Readonly<Record<string, ClosureReason>> = {
  MAINTENANCE: 'maintenance',
  TECHNICAL_INCIDENT: 'technical_incident',
  INSTITUTIONAL_EVENT: 'institutional_event',
  EXTERNAL_USE: 'external_use',
  OTHER: 'other',
};

function toClosure(dto: ClosureDto): SpaceClosure {
  return {
    id: dto.id,
    spaceId: dto.spaceId,
    startsAt: fromIsoDateTime(dto.startsAt),
    endsAt: dto.endsAt ? fromIsoDateTime(dto.endsAt) : null,
    reason: REASONS[dto.reason] ?? 'other',
    details: dto.details,
    createdAt: fromIsoDateTime(dto.createdAt),
    revertedAt: dto.revertedAt ? fromIsoDateTime(dto.revertedAt) : null,
  };
}

@Injectable()
export class HttpSpaceClosureRepository extends SpaceClosureRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/admin/spaces`;

  closuresOf(spaceId: string): Observable<readonly SpaceClosure[]> {
    return this.http
      .get<readonly ClosureDto[]>(`${this.baseUrl}/${spaceId}/closures`)
      .pipe(map((closures) => closures.map(toClosure)));
  }

  close(spaceId: string, request: ClosureRequest): Observable<SpaceClosure> {
    return this.http
      .post<ClosureDto>(`${this.baseUrl}/${spaceId}/closures`, {
        startsAt: toIsoDateTime(request.startsAt),
        endsAt: request.endsAt === null ? null : toIsoDateTime(request.endsAt),
        reason: request.reason.toUpperCase(),
        details: request.details,
      })
      .pipe(map(toClosure));
  }

  revert(spaceId: string, closureId: string): Observable<SpaceClosure> {
    return this.http
      .post<ClosureDto>(`${this.baseUrl}/${spaceId}/closures/${closureId}/revert`, {})
      .pipe(map(toClosure));
  }
}
