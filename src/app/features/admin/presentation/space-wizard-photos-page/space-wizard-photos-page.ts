import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { SpaceDraftStore } from '../../application/space-draft.store';
import { arePhotosComplete } from '../../domain/space-draft';
import { SpacePhotoEditor } from '../space-photo-editor/space-photo-editor';
import type { PhotoItem } from '../space-photo-row/space-photo-row';

/** Matches `univgo.spaces.images.max-per-space`; the server refuses more. */
const MAX_PHOTOS = 8;

/**
 * Step four: the photographs, still in the browser. Nothing is uploaded here — the files travel with
 * the publish request in step five, so abandoning the wizard leaves nothing in the bucket.
 */
@Component({
  selector: 'app-space-wizard-photos-page',
  imports: [SpacePhotoEditor, TuiButton],
  templateUrl: './space-wizard-photos-page.html',
  styleUrl: './space-wizard-photos-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceWizardPhotosPage {
  private readonly router = inject(Router);

  protected readonly draft = inject(SpaceDraftStore);

  protected readonly items = computed<readonly PhotoItem[]>(() =>
    this.draft.photos().map((photo) => ({
      id: photo.id,
      previewUrl: photo.previewUrl,
      label: photo.file.name,
    })),
  );

  protected readonly remaining = computed(() => MAX_PHOTOS - this.draft.photos().length);

  protected readonly valid = computed(() => arePhotosComplete(this.draft.photos()));

  protected back(): void {
    void this.router.navigate(['/admin', 'spaces', 'new', 'schedules']);
  }

  protected continue(): void {
    void this.router.navigate(['/admin', 'spaces', 'new', 'review']);
  }
}
