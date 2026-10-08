import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { fromIsoDateTime, minutesFromIsoTime, toIsoTime } from '../../../shared/time/api-time';
import { categoryFromName } from '../../spaces/domain/space';
import type {
  AdminSpaceDetail,
  AdminSpaceImage,
  AdminSpaceSummary,
  ScheduleWindow,
  SpaceType,
} from '../domain/admin-space-detail';
import {
  AdminSpaceCrudRepository,
  type SpaceIdentityUpdate,
  type SpaceUsageUpdate,
} from '../domain/admin-space-crud.repository';
import type { PublishableSpaceDraft, ScheduleWindowDraft } from '../domain/space-draft';

interface SpaceTypeDto {
  readonly id: string;
  readonly name: string;
  readonly category: string;
}

interface SpaceImageDto {
  readonly id: string;
  readonly position: number;
  readonly url: string;
  readonly width: number;
  readonly height: number;
}

interface ScheduleWindowDto {
  readonly id: string;
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
}

interface AdminSpaceSummaryDto {
  readonly spaceId: string;
  readonly name: string;
  readonly location: string;
  readonly spaceTypeId: string;
  readonly spaceTypeName: string;
  readonly category: string;
  readonly capacity: number;
  readonly scheduleWindowCount: number;
  readonly imageCount: number;
  readonly coverImageUrl: string | null;
  readonly archived: boolean;
}

interface AdminSpaceDetailDto extends AdminSpaceSummaryDto {
  readonly description: string;
  readonly rules: readonly string[];
  readonly archivedAt: string | null;
  readonly schedules: readonly ScheduleWindowDto[];
  readonly images: readonly SpaceImageDto[];
}

interface ArchiveSpaceDto {
  readonly suspendedReservations: number;
}

function toSpaceType(dto: SpaceTypeDto): SpaceType {
  return { id: dto.id, name: dto.name, category: categoryFromName(dto.category) };
}

function toImage(dto: SpaceImageDto): AdminSpaceImage {
  return {
    id: dto.id,
    position: dto.position,
    url: dto.url,
    width: dto.width,
    height: dto.height,
  };
}

function toWindow(dto: ScheduleWindowDto): ScheduleWindow {
  return {
    id: dto.id,
    dayOfWeek: dto.dayOfWeek,
    fromMinutes: minutesFromIsoTime(dto.startTime),
    toMinutes: minutesFromIsoTime(dto.endTime),
  };
}

function toSummary(dto: AdminSpaceSummaryDto): AdminSpaceSummary {
  return {
    spaceId: dto.spaceId,
    name: dto.name,
    location: dto.location,
    spaceTypeId: dto.spaceTypeId,
    spaceTypeName: dto.spaceTypeName,
    category: categoryFromName(dto.category),
    capacity: dto.capacity,
    scheduleWindowCount: dto.scheduleWindowCount,
    imageCount: dto.imageCount,
    coverImageUrl: dto.coverImageUrl,
    archived: dto.archived,
  };
}

function toDetail(dto: AdminSpaceDetailDto): AdminSpaceDetail {
  return {
    ...toSummary(dto),
    description: dto.description,
    rules: dto.rules,
    archivedAt: dto.archivedAt ? fromIsoDateTime(dto.archivedAt) : null,
    schedules: dto.schedules.map(toWindow),
    images: dto.images.map(toImage),
  };
}

function toWindowPayload(window: ScheduleWindowDraft): {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
} {
  return {
    dayOfWeek: window.dayOfWeek,
    startTime: toIsoTime(window.fromMinutes),
    endTime: toIsoTime(window.toMinutes),
  };
}

@Injectable()
export class HttpAdminSpaceCrudRepository extends AdminSpaceCrudRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/admin/spaces`;
  private readonly typesUrl = `${inject(APP_CONFIG).apiBaseUrl}/admin/space-types`;

  list(includeArchived: boolean): Observable<readonly AdminSpaceSummary[]> {
    return this.http
      .get<readonly AdminSpaceSummaryDto[]>(this.baseUrl, {
        params: { includeArchived },
      })
      .pipe(map((spaces) => spaces.map(toSummary)));
  }

  detail(spaceId: string): Observable<AdminSpaceDetail> {
    return this.http.get<AdminSpaceDetailDto>(`${this.baseUrl}/${spaceId}`).pipe(map(toDetail));
  }

  spaceTypes(): Observable<readonly SpaceType[]> {
    return this.http
      .get<readonly SpaceTypeDto[]>(this.typesUrl)
      .pipe(map((types) => types.map(toSpaceType)));
  }

  /**
   * The JSON goes in one part and each photograph in another. **Part order is photograph order**,
   * which is why the files are appended in the draft's own order and not collected into one field:
   * the server reads them as a list and position 0 becomes the cover.
   *
   * The JSON part carries an explicit content type. Without it the browser sends a `Blob` part as
   * `application/octet-stream` and Spring refuses to bind it to a `@RequestPart` record.
   */
  create(draft: PublishableSpaceDraft): Observable<AdminSpaceDetail> {
    const body = new FormData();

    body.append(
      'space',
      new Blob(
        [
          JSON.stringify({
            name: draft.name,
            location: draft.location,
            spaceTypeId: draft.spaceTypeId,
            capacity: draft.capacity,
            description: draft.description,
            rules: draft.rules,
            schedules: draft.schedules.map(toWindowPayload),
          }),
        ],
        { type: 'application/json' },
      ),
    );

    for (const photo of draft.photos) {
      body.append('photos', photo.file, photo.file.name);
    }

    return this.http.post<AdminSpaceDetailDto>(this.baseUrl, body).pipe(map(toDetail));
  }

  updateIdentity(spaceId: string, update: SpaceIdentityUpdate): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${spaceId}/identity`, update);
  }

  updateUsage(spaceId: string, update: SpaceUsageUpdate): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${spaceId}/usage`, update);
  }

  replaceSchedules(
    spaceId: string,
    windows: readonly ScheduleWindowDraft[],
  ): Observable<readonly ScheduleWindow[]> {
    return this.http
      .put<readonly ScheduleWindowDto[]>(`${this.baseUrl}/${spaceId}/schedules`, {
        schedules: windows.map(toWindowPayload),
      })
      .pipe(map((schedules) => schedules.map(toWindow)));
  }

  addImages(spaceId: string, files: readonly File[]): Observable<readonly AdminSpaceImage[]> {
    const body = new FormData();

    for (const file of files) {
      body.append('photos', file, file.name);
    }

    return this.http
      .post<readonly SpaceImageDto[]>(`${this.baseUrl}/${spaceId}/images`, body)
      .pipe(map((images) => images.map(toImage)));
  }

  deleteImage(spaceId: string, imageId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${spaceId}/images/${imageId}`);
  }

  reorderImages(
    spaceId: string,
    imageIds: readonly string[],
  ): Observable<readonly AdminSpaceImage[]> {
    return this.http
      .put<readonly SpaceImageDto[]>(`${this.baseUrl}/${spaceId}/images/order`, { imageIds })
      .pipe(map((images) => images.map(toImage)));
  }

  archive(spaceId: string): Observable<number> {
    return this.http
      .post<ArchiveSpaceDto>(`${this.baseUrl}/${spaceId}/archive`, {})
      .pipe(map((response) => response.suspendedReservations));
  }

  restore(spaceId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${spaceId}/restore`, {});
  }
}
