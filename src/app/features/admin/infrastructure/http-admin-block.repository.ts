import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { minutesFromIsoTime } from '../../../shared/time/api-time';
import { toIsoDate } from '../../../shared/time/calendar-day';
import { type AdminBlock, AdminBlockRepository } from '../domain/admin-block.repository';

interface BlockSummaryDto {
  readonly start: string;
  readonly end: string;
  readonly capacity: number;
  readonly occupied: number;
  readonly free: number;
}

function toBlock(dto: BlockSummaryDto): AdminBlock {
  return {
    startMinutes: minutesFromIsoTime(dto.start),
    endMinutes: minutesFromIsoTime(dto.end),
    capacity: dto.capacity,
    occupied: dto.occupied,
    free: dto.free,
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
      .pipe(map((blocks) => blocks.map(toBlock)));
  }
}
