import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { TuiBadge } from '@taiga-ui/kit';
import { MediaPlate } from '../../../../shared/media-plate/media-plate';

/** One photograph as the editor lists it, whether it is already uploaded or still a local file. */
export interface PhotoItem {
  readonly id: string;
  readonly previewUrl: string;
  /** What names the photograph to a screen reader: a file name, or its place in the album. */
  readonly label: string;
}

/**
 * Level 3: one row of the photograph editor.
 *
 * Reordering is done with buttons and nothing else. Taiga's `TuiTiles` would give drag-and-drop,
 * but its handle only listens for pointer events, so as the sole mechanism it fails WCAG 2.2
 * success criterion 2.5.7 (Dragging Movements). If dragging is ever wanted it goes on top of these
 * buttons, never instead of them.
 *
 * Each button names its subject rather than relying on its position in the DOM, because a person
 * listening to a list of buttons otherwise hears "Mover arriba" four times.
 */
@Component({
  selector: 'app-space-photo-row',
  imports: [MediaPlate, TuiBadge, TuiButton],
  templateUrl: './space-photo-row.html',
  styleUrl: './space-photo-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpacePhotoRow {
  public readonly photo = input.required<PhotoItem>();
  public readonly index = input.required<number>();
  public readonly total = input.required<number>();
  public readonly disabled = input(false);

  public readonly movedUp = output<void>();
  public readonly movedDown = output<void>();
  public readonly coverSet = output<void>();
  public readonly removed = output<void>();

  protected readonly isCover = computed(() => this.index() === 0);
  protected readonly isFirst = computed(() => this.index() === 0);
  protected readonly isLast = computed(() => this.index() === this.total() - 1);

  /** The last photograph cannot go: a published space always has one. */
  protected readonly removable = computed(() => this.total() > 1);

  /**
   * The photograph's own name is interpolated into each action's accessible name. It sits in quotes
   * and never governs an article, so the phrase survives translation — which is the thing §6 of
   * `CLAUDE.md` warns about when a name is dropped into a sentence.
   */
  protected readonly moveUpLabel = computed(
    () => $localize`:@@admin.spacePhotos.moveUp:Mover «${this.photo().label}» una posición arriba`,
  );

  protected readonly moveDownLabel = computed(
    () => $localize`:@@admin.spacePhotos.moveDown:Mover «${this.photo().label}» una posición abajo`,
  );

  protected readonly makeCoverLabel = computed(
    () => $localize`:@@admin.spacePhotos.makeCover:Usar «${this.photo().label}» como portada`,
  );

  protected readonly removeLabel = computed(
    () => $localize`:@@admin.spacePhotos.remove:Quitar «${this.photo().label}»`,
  );
}
