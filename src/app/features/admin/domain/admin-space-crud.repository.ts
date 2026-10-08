import type { Observable } from 'rxjs';
import type {
  AdminSpaceDetail,
  AdminSpaceImage,
  AdminSpaceSummary,
  ScheduleWindow,
  SpaceType,
} from './admin-space-detail';
import type { PublishableSpaceDraft, ScheduleWindowDraft } from './space-draft';

export interface SpaceIdentityUpdate {
  readonly name: string;
  readonly location: string;
  readonly spaceTypeId: string;
  readonly capacity: number;
}

export interface SpaceUsageUpdate {
  readonly description: string;
  readonly rules: readonly string[];
}

/**
 * Managing the catalogue of spaces.
 *
 * The identity and the usage are saved separately because the edit screen saves one section at a
 * time: a full replace sent from one section would carry whatever the other section's form happened
 * to be holding, which is a lost update as soon as two tabs are open.
 */
export abstract class AdminSpaceCrudRepository {
  abstract list(includeArchived: boolean): Observable<readonly AdminSpaceSummary[]>;

  abstract detail(spaceId: string): Observable<AdminSpaceDetail>;

  abstract spaceTypes(): Observable<readonly SpaceType[]>;

  /** One request for the whole space: either it exists complete or it does not exist. */
  abstract create(draft: PublishableSpaceDraft): Observable<AdminSpaceDetail>;

  abstract updateIdentity(spaceId: string, update: SpaceIdentityUpdate): Observable<void>;

  abstract updateUsage(spaceId: string, update: SpaceUsageUpdate): Observable<void>;

  /** Replaces the whole week; the server rejects an overlapping one. */
  abstract replaceSchedules(
    spaceId: string,
    windows: readonly ScheduleWindowDraft[],
  ): Observable<readonly ScheduleWindow[]>;

  /** Appends at the end of the existing order and returns the space's whole list. */
  abstract addImages(
    spaceId: string,
    files: readonly File[],
  ): Observable<readonly AdminSpaceImage[]>;

  /** Refused by the server when it would leave the space with none. */
  abstract deleteImage(spaceId: string, imageId: string): Observable<void>;

  /** Must list every photograph of the space exactly once; the first becomes the cover. */
  abstract reorderImages(
    spaceId: string,
    imageIds: readonly string[],
  ): Observable<readonly AdminSpaceImage[]>;

  /** Resolves with how many reservations the archiving suspended; none are cancelled. */
  abstract archive(spaceId: string): Observable<number>;

  abstract restore(spaceId: string): Observable<void>;
}
