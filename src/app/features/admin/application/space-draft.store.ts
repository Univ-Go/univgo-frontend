import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, type Observable, tap } from 'rxjs';
import { AdminSpaceCrudRepository } from '../domain/admin-space-crud.repository';
import type { AdminSpaceDetail } from '../domain/admin-space-detail';
import {
  type ScheduleWindowDraft,
  type SpaceIdentityDraft,
  type SpacePhotoDraft,
  type SpaceUsageDraft,
  emptyIdentity,
  emptyUsage,
  makeCover,
  movePhoto,
  publishableDraft,
} from '../domain/space-draft';

let nextPhotoId = 0;

/**
 * Everything the creation wizard has collected, and the one action that turns it into a space.
 *
 * Provided by the `spaces/new` route rather than in root, so the five steps share one instance and
 * nothing outside the wizard can read a half-filled space. It does outlive a single visit, though —
 * a route's `providers` injector is cached on the route config rather than destroyed on
 * deactivation — so what starts a clean space is `spaceWizardRestartGuard`, not leaving the page.
 * Same arrangement, and the same trap, as `BookingDraftStore`.
 *
 * **Nothing is uploaded until the last step.** The photographs live here as `File` objects with a
 * local preview, so abandoning the wizard leaves nothing behind: no row, no object in the bucket,
 * no space that a student could see half-configured.
 */
@Injectable()
export class SpaceDraftStore {
  private readonly spaces = inject(AdminSpaceCrudRepository);

  private readonly identityDraft = signal<SpaceIdentityDraft>(emptyIdentity());
  private readonly usageDraft = signal<SpaceUsageDraft>(emptyUsage());
  private readonly scheduleDrafts = signal<readonly ScheduleWindowDraft[]>([]);
  private readonly photoDrafts = signal<readonly SpacePhotoDraft[]>([]);
  private readonly created = signal<AdminSpaceDetail | null>(null);

  public readonly identity = this.identityDraft.asReadonly();
  public readonly usage = this.usageDraft.asReadonly();
  public readonly schedules = this.scheduleDrafts.asReadonly();
  public readonly photos = this.photoDrafts.asReadonly();

  /** Set once the server has created the space, which is what ends the wizard. */
  public readonly space = this.created.asReadonly();

  /** Non-null only when every step is answered; the review step's publish button reads this. */
  public readonly publishable = computed(() =>
    publishableDraft({
      identity: this.identityDraft(),
      usage: this.usageDraft(),
      schedules: this.scheduleDrafts(),
      photos: this.photoDrafts(),
    }),
  );

  /**
   * Something a person would be sorry to lose: an answer already given that has not become a space
   * yet. It is what decides whether leaving the wizard is worth interrupting.
   */
  public readonly hasUnsavedChoice = computed(
    () =>
      this.created() === null &&
      (this.identityDraft().name.trim().length > 0 ||
        this.identityDraft().location.trim().length > 0 ||
        this.usageDraft().description.trim().length > 0 ||
        this.scheduleDrafts().length > 0 ||
        this.photoDrafts().length > 0),
  );

  public setIdentity(identity: SpaceIdentityDraft): void {
    this.identityDraft.set(identity);
  }

  public setUsage(usage: SpaceUsageDraft): void {
    this.usageDraft.set(usage);
  }

  public setSchedules(windows: readonly ScheduleWindowDraft[]): void {
    this.scheduleDrafts.set(windows);
  }

  public addPhotos(files: readonly File[]): void {
    this.photoDrafts.update((photos) => [
      ...photos,
      ...files.map((file) => ({
        id: `photo-${nextPhotoId++}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }

  public movePhoto(from: number, to: number): void {
    this.photoDrafts.update((photos) => movePhoto(photos, from, to));
  }

  public makeCover(photoId: string): void {
    this.photoDrafts.update((photos) => makeCover(photos, photoId));
  }

  public removePhoto(photoId: string): void {
    this.photoDrafts.update((photos) => {
      const dropped = photos.find((photo) => photo.id === photoId);

      if (dropped) {
        URL.revokeObjectURL(dropped.previewUrl);
      }

      return photos.filter((photo) => photo.id !== photoId);
    });
  }

  /**
   * One request with everything: the fields as a JSON part and the files as the rest, in the order
   * the administrator arranged them. Either the space exists complete or it does not exist.
   *
   * An incomplete draft cannot reach this — `spaceWizardPhotosGuard` keeps the review step out of
   * reach without one — so publishing empty is the unreachable branch rather than an error to
   * report.
   */
  public publish(): Observable<AdminSpaceDetail> {
    const draft = this.publishable();

    if (!draft) {
      return EMPTY;
    }

    return this.spaces.create(draft).pipe(tap((space) => this.created.set(space)));
  }

  /**
   * Back to an empty draft, which is what creating another space means.
   *
   * Revoking every preview is not housekeeping: without it the wizard leaks one blob per abandoned
   * photograph for as long as the tab is open.
   */
  public reset(): void {
    for (const photo of this.photoDrafts()) {
      URL.revokeObjectURL(photo.previewUrl);
    }

    this.identityDraft.set(emptyIdentity());
    this.usageDraft.set(emptyUsage());
    this.scheduleDrafts.set([]);
    this.photoDrafts.set([]);
    this.created.set(null);
  }
}
