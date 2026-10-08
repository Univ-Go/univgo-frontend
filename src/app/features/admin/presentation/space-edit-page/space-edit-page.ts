import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TuiAppearance, TuiButton, TuiDialogService, TuiLoader } from '@taiga-ui/core';
import { TUI_CONFIRM, TuiBadge, TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { defaultIfEmpty } from 'rxjs';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { AdminSpacesStore } from '../../application/admin-spaces.store';
import { AdminSpaceCrudRepository } from '../../domain/admin-space-crud.repository';
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
 * Editing a space, section by section.
 *
 * Not the wizard: the wizard exists because the order matters the first time, and reopening it to
 * fix a capacity would mean walking five steps that were already right. Each section here saves on
 * its own, which is why the server has one endpoint per section rather than one full replace — a
 * replace sent from one section would carry whatever the others happened to be holding.
 *
 * Each section owns its own in-flight signal. One shared flag would grey out the capacity field
 * while a photograph uploads.
 *
 * On success a section re-reads the detail rather than patching what it has: the server is the
 * authority on order and on derived URLs. On failure it only clears its flag — the toast is the
 * interceptor's job.
 */
@Component({
  selector: 'app-space-edit-page',
  imports: [
    EmptyState,
    SpaceIdentityForm,
    SpacePhotoEditor,
    SpaceScheduleEditor,
    SpaceUsageForm,
    TuiAppearance,
    TuiBadge,
    TuiButton,
    TuiLoader,
    TuiCardLarge,
    TuiSkeleton,
    TuiSurface,
  ],
  templateUrl: './space-edit-page.html',
  styleUrl: './space-edit-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceEditPage {
  public readonly spaceId = input.required<string>();

  private readonly spaces = inject(AdminSpaceCrudRepository);
  private readonly directory = inject(AdminSpacesStore);
  private readonly notifications = inject(NotificationService);
  private readonly dialogs = inject(TuiDialogService);
  private readonly router = inject(Router);

  protected readonly detail = rxResource({
    params: () => this.spaceId(),
    stream: ({ params }) => this.spaces.detail(params),
    defaultValue: undefined,
  });

  protected readonly types = rxResource({
    stream: () => this.spaces.spaceTypes(),
    defaultValue: [],
  });

  protected readonly savingIdentity = signal(false);
  protected readonly savingUsage = signal(false);
  protected readonly savingSchedules = signal(false);
  protected readonly savingPhotos = signal(false);
  protected readonly archiving = signal(false);

  /**
   * Each section's working copy, seeded from the server's answer. They are separate signals rather
   * than one object so that editing the hours never marks the identity dirty.
   */
  protected readonly identity = signal<SpaceIdentityDraft | null>(null);
  protected readonly usage = signal<SpaceUsageDraft | null>(null);
  protected readonly schedules = signal<readonly ScheduleWindowDraft[] | null>(null);

  protected readonly identityValue = computed(
    () =>
      this.identity() ?? {
        name: this.detail.value()?.name ?? '',
        location: this.detail.value()?.location ?? '',
        spaceTypeId: this.detail.value()?.spaceTypeId ?? null,
        capacity: this.detail.value()?.capacity ?? null,
      },
  );

  protected readonly usageValue = computed(
    () =>
      this.usage() ?? {
        description: this.detail.value()?.description ?? '',
        rules: this.detail.value()?.rules ?? [],
      },
  );

  protected readonly scheduleValue = computed<readonly ScheduleWindowDraft[]>(
    () =>
      this.schedules() ??
      (this.detail.value()?.schedules ?? []).map((window) => ({
        dayOfWeek: window.dayOfWeek,
        fromMinutes: window.fromMinutes,
        toMinutes: window.toMinutes,
      })),
  );

  protected readonly photoItems = computed<readonly PhotoItem[]>(() =>
    (this.detail.value()?.images ?? []).map((image, index) => ({
      id: image.id,
      previewUrl: image.url,
      label: $localize`:@@admin.spacePhotos.positionLabel:Foto ${index + 1}`,
    })),
  );

  protected readonly remainingPhotos = computed(
    () => MAX_PHOTOS - (this.detail.value()?.images.length ?? 0),
  );

  protected readonly identityValid = computed(() => isIdentityComplete(this.identityValue()));
  protected readonly usageValid = computed(() => isUsageComplete(this.usageValue()));
  protected readonly schedulesValid = computed(() => isSchedulesComplete(this.scheduleValue()));

  protected saveIdentity(): void {
    const value = this.identityValue();

    if (this.savingIdentity() || !this.identityValid() || value.spaceTypeId === null) {
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
          this.identity.set(null);
          // The name and the capacity are both in the shell's space switcher, so the directory has
          // to be re-read. The other sections reach neither it nor the grid.
          this.directory.refresh();
          this.detail.reload();
          this.saved();
        },
        error: () => this.savingIdentity.set(false),
      });
  }

  protected saveUsage(): void {
    if (this.savingUsage() || !this.usageValid()) {
      return;
    }

    this.savingUsage.set(true);

    this.spaces.updateUsage(this.spaceId(), this.usageValue()).subscribe({
      next: () => {
        this.savingUsage.set(false);
        this.usage.set(null);
        this.detail.reload();
        this.saved();
      },
      error: () => this.savingUsage.set(false),
    });
  }

  protected saveSchedules(): void {
    if (this.savingSchedules() || !this.schedulesValid()) {
      return;
    }

    this.savingSchedules.set(true);

    this.spaces.replaceSchedules(this.spaceId(), this.scheduleValue()).subscribe({
      next: () => {
        this.savingSchedules.set(false);
        this.schedules.set(null);
        this.detail.reload();
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
        this.detail.reload();
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
        this.detail.reload();
        this.saved();
      },
      error: () => this.savingPhotos.set(false),
    });
  }

  /**
   * Archiving is the destructive one, so it asks first and says what it affects. It suspends the
   * space's reservations rather than cancelling them — clearing them is a separate, irreversible
   * action — and the count is what makes that concrete before the administrator commits.
   */
  protected archive(): void {
    this.dialogs
      .open<boolean>(TUI_CONFIRM, {
        size: 's',
        label: $localize`:@@admin.spaceArchive.confirm.title:¿Archivar este espacio?`,
        data: {
          content: $localize`:@@admin.spaceArchive.confirm.content:Dejará de aparecer en el catálogo y no se podrá reservar. Las reservas que ya existen quedarán suspendidas, no canceladas, y su historial se conserva. Puedes restaurarlo después.`,
          yes: $localize`:@@admin.spaceArchive.confirm.yes:Archivar`,
          no: $localize`:@@admin.spaceArchive.confirm.no:Cancelar`,
          appearance: 'primary-destructive',
        },
      })
      .pipe(defaultIfEmpty(false))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.runArchive();
        }
      });
  }

  protected restore(): void {
    if (this.archiving()) {
      return;
    }

    this.archiving.set(true);

    this.spaces.restore(this.spaceId()).subscribe({
      next: () => {
        this.archiving.set(false);
        this.directory.refresh();
        this.detail.reload();
        this.notifications.success(
          $localize`:@@admin.spaceArchive.restored.summary:Espacio restaurado`,
          $localize`:@@admin.spaceArchive.restored.detail:Vuelve al catálogo. Sigue cerrado hasta que reabras el cierre que creó el archivado.`,
        );
      },
      error: () => this.archiving.set(false),
    });
  }

  protected backToGrid(): void {
    void this.router.navigate(['/admin', 'spaces']);
  }

  protected retry(): void {
    this.detail.reload();
  }

  private runArchive(): void {
    if (this.archiving()) {
      return;
    }

    this.archiving.set(true);

    this.spaces.archive(this.spaceId()).subscribe({
      next: (suspended) => {
        this.archiving.set(false);
        this.directory.refresh();
        this.detail.reload();
        this.notifications.success(
          $localize`:@@admin.spaceArchive.archived.summary:Espacio archivado`,
          suspended === 0
            ? $localize`:@@admin.spaceArchive.archived.none:Ya no aparece en el catálogo. No había reservas activas.`
            : $localize`:@@admin.spaceArchive.archived.some:Ya no aparece en el catálogo. ${suspended} reservas quedaron suspendidas.`,
        );
      },
      error: () => this.archiving.set(false),
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
        this.detail.reload();
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
