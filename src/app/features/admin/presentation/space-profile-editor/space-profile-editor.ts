import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TuiAppearance, TuiButton, TuiIcon, TuiLoader } from '@taiga-ui/core';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { ScrollSpySection } from '../../../../shared/scroll-spy/scroll-spy';
import { AdminSpacesStore } from '../../application/admin-spaces.store';
import { AdminSpaceCrudRepository } from '../../domain/admin-space-crud.repository';
import type { AdminSpaceDetail } from '../../domain/admin-space-detail';
import {
  type ScheduleWindowDraft,
  type SpaceIdentityDraft,
  type SpaceUsageDraft,
  isIdentityComplete,
  isSchedulesComplete,
  isUsageComplete,
} from '../../domain/space-draft';
import { SpaceIdentityForm } from '../space-identity-form/space-identity-form';
import { SpacePhotoEditor } from '../space-photo-editor/space-photo-editor';
import type { PhotoItem } from '../space-photo-row/space-photo-row';
import { SpaceScheduleEditor } from '../space-schedule-editor/space-schedule-editor';
import { SpaceUsageForm } from '../space-usage-form/space-usage-form';

/** Matches `univgo.spaces.images.max-per-space`; the server refuses more. */
const MAX_PHOTOS = 8;

/**
 * Level 3: what a space is — identity, usage, hours and photographs — edited section by section
 * inside the space's settings, each section a stop in the settings page's table of contents.
 *
 * Not the wizard: the wizard exists because the order matters the first time, and reopening it to
 * fix a capacity would mean walking five steps that were already right. Each section here saves on
 * its own, which is why the server has one endpoint per section rather than one full replace — a
 * replace sent from one section would carry whatever the others happened to be holding.
 *
 * Each section owns its own in-flight signal. One shared flag would grey out the capacity field
 * while a photograph uploads.
 *
 * On success a section asks the page to re-read the detail rather than patching what it has: the
 * server is the authority on order and on derived URLs. On failure it only clears its flag — the
 * toast is the interceptor's job.
 */
@Component({
  selector: 'app-space-profile-editor',
  imports: [
    ScrollSpySection,
    SpaceIdentityForm,
    SpacePhotoEditor,
    SpaceScheduleEditor,
    SpaceUsageForm,
    TuiAppearance,
    TuiButton,
    TuiIcon,
    TuiLoader,
    TuiCardLarge,
    TuiSurface,
  ],
  templateUrl: './space-profile-editor.html',
  styleUrl: './space-profile-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceProfileEditor {
  public readonly space = input.required<AdminSpaceDetail>();

  /** A section saved: the page re-reads the detail this component is showing. */
  public readonly changed = output<void>();

  private readonly spaceId = computed(() => this.space().spaceId);

  private readonly spaces = inject(AdminSpaceCrudRepository);
  private readonly directory = inject(AdminSpacesStore);
  private readonly notifications = inject(NotificationService);

  protected readonly types = rxResource({
    stream: () => this.spaces.spaceTypes(),
    defaultValue: [],
  });

  protected readonly savingIdentity = signal(false);
  protected readonly savingUsage = signal(false);
  protected readonly savingSchedules = signal(false);
  protected readonly savingPhotos = signal(false);

  /**
   * Each section's working copy, seeded from the server's answer. They are separate signals rather
   * than one object so that editing the hours never marks the identity dirty. Linked to the space
   * rather than emptied on save: the page keeps the old detail on screen while it re-reads it, and an
   * emptied draft would show the old values for that instant before the new ones arrived. A draft
   * is `null` until the section is edited, which is what tells Guardar and Descartar they have work.
   */
  protected readonly identity = linkedSignal<AdminSpaceDetail, SpaceIdentityDraft | null>({
    source: this.space,
    computation: () => null,
  });
  protected readonly usage = linkedSignal<AdminSpaceDetail, SpaceUsageDraft | null>({
    source: this.space,
    computation: () => null,
  });
  protected readonly schedules = linkedSignal<
    AdminSpaceDetail,
    readonly ScheduleWindowDraft[] | null
  >({ source: this.space, computation: () => null });

  protected readonly identityValue = computed(
    () =>
      this.identity() ?? {
        name: this.space().name,
        location: this.space().location,
        spaceTypeId: this.space().spaceTypeId,
        capacity: this.space().capacity,
      },
  );

  protected readonly usageValue = computed(
    () =>
      this.usage() ?? {
        description: this.space().description,
        rules: this.space().rules,
      },
  );

  protected readonly scheduleValue = computed<readonly ScheduleWindowDraft[]>(
    () =>
      this.schedules() ??
      this.space().schedules.map((window) => ({
        dayOfWeek: window.dayOfWeek,
        fromMinutes: window.fromMinutes,
        toMinutes: window.toMinutes,
      })),
  );

  protected readonly photoItems = computed<readonly PhotoItem[]>(() =>
    this.space().images.map((image, index) => ({
      id: image.id,
      previewUrl: image.url,
      label: $localize`:@@admin.spacePhotos.positionLabel:Foto ${index + 1}`,
    })),
  );

  protected readonly remainingPhotos = computed(() => MAX_PHOTOS - this.space().images.length);

  protected readonly identityValid = computed(() => isIdentityComplete(this.identityValue()));
  protected readonly usageValid = computed(() => isUsageComplete(this.usageValue()));
  protected readonly schedulesValid = computed(() => isSchedulesComplete(this.scheduleValue()));

  protected saveIdentity(): void {
    const value = this.identityValue();

    if (
      this.identity() === null ||
      this.savingIdentity() ||
      !this.identityValid() ||
      value.spaceTypeId === null
    ) {
      return;
    }

    this.savingIdentity.set(true);

    this.spaces
      .updateIdentity(this.spaceId(), {
        name: value.name,
        location: value.location,
        spaceTypeId: value.spaceTypeId,
        capacity: value.capacity ?? 0,
      })
      .subscribe({
        next: () => {
          this.savingIdentity.set(false);
          // The name and the capacity are both in the shell's space switcher, so the directory has
          // to be re-read. The other sections reach neither it nor the grid.
          this.directory.refresh();
          this.changed.emit();
          this.saved();
        },
        error: () => this.savingIdentity.set(false),
      });
  }

  protected saveUsage(): void {
    if (this.usage() === null || this.savingUsage() || !this.usageValid()) {
      return;
    }

    this.savingUsage.set(true);

    this.spaces.updateUsage(this.spaceId(), this.usageValue()).subscribe({
      next: () => {
        this.savingUsage.set(false);
        this.changed.emit();
        this.saved();
      },
      error: () => this.savingUsage.set(false),
    });
  }

  protected saveSchedules(): void {
    if (this.schedules() === null || this.savingSchedules() || !this.schedulesValid()) {
      return;
    }

    this.savingSchedules.set(true);

    this.spaces.replaceSchedules(this.spaceId(), this.scheduleValue()).subscribe({
      next: () => {
        this.savingSchedules.set(false);
        this.changed.emit();
        this.saved();
      },
      error: () => this.savingSchedules.set(false),
    });
  }

  protected addPhotos(files: readonly File[]): void {
    if (this.savingPhotos()) {
      return;
    }

    this.savingPhotos.set(true);

    this.spaces.addImages(this.spaceId(), [...files]).subscribe({
      next: () => {
        this.savingPhotos.set(false);
        this.changed.emit();
        this.saved();
      },
      error: () => this.savingPhotos.set(false),
    });
  }

  protected movePhoto(from: number, to: number): void {
    const ids = this.photoItems().map((item) => item.id);

    if (this.savingPhotos() || to < 0 || to >= ids.length) {
      return;
    }

    const reordered = [...ids];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);

    this.reorder(reordered);
  }

  protected setCover(photoId: string): void {
    const ids = this.photoItems().map((item) => item.id);

    this.reorder([photoId, ...ids.filter((id) => id !== photoId)]);
  }

  protected removePhoto(photoId: string): void {
    if (this.savingPhotos()) {
      return;
    }

    this.savingPhotos.set(true);

    this.spaces.deleteImage(this.spaceId(), photoId).subscribe({
      next: () => {
        this.savingPhotos.set(false);
        this.changed.emit();
        this.saved();
      },
      error: () => this.savingPhotos.set(false),
    });
  }

  private reorder(imageIds: readonly string[]): void {
    if (this.savingPhotos()) {
      return;
    }

    this.savingPhotos.set(true);

    this.spaces.reorderImages(this.spaceId(), imageIds).subscribe({
      next: () => {
        this.savingPhotos.set(false);
        this.changed.emit();
      },
      error: () => this.savingPhotos.set(false),
    });
  }

  private saved(): void {
    this.notifications.success(
      $localize`:@@admin.spaceEdit.saved.summary:Cambios guardados`,
      $localize`:@@admin.spaceEdit.saved.detail:Los estudiantes ya ven la información nueva.`,
    );
  }
}
