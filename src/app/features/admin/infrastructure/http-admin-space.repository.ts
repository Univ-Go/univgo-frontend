import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { AdminSpaceRepository } from '../domain/admin-space.repository';

interface CancelledReservationsDto {
  readonly cancelledCount: number;
}

@Injectable()
export class HttpAdminSpaceRepository extends AdminSpaceRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/admin/spaces`;

  setMaintenance(spaceId: string, underMaintenance: boolean): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${spaceId}/maintenance`, { underMaintenance });
  }

  cancelAllReservations(spaceId: string): Observable<number> {
    return this.http
      .post<CancelledReservationsDto>(`${this.baseUrl}/${spaceId}/reservations/cancel-all`, {})
      .pipe(map((response) => response.cancelledCount));
  }
}
