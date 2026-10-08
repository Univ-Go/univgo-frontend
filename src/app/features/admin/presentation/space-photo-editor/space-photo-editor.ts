import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiFiles } from '@taiga-ui/kit';
import { type PhotoItem, SpacePhotoRow } from '../space-photo-row/space-photo-row';

/** Six megabytes, matching `spring.servlet.multipart.max-file-size`; the server rejects more. */
const MAX_FILE_SIZE = 6 * 1024 * 1024;

/** The JDK has no WebP codec, so the server can neither decode nor derive one. */
const ACCEPTED_TYPES = '.jpg,.jpeg,.png';

export interface PhotoMove {
  readonly from: number;
  readonly to: number;
}

/**
 * Level 2: a space's photographs, in order, with the first as the cover.
 *
 * It emits intents rather than mutating a list, because the two hosts apply them differently: in the
 * creation wizard every change is local — the files have not been uploaded yet — while on the edit
 * screen each one is a request. One component, two appliers, no mode flag.
 *
 * Two things about `tuiInputFiles` that are easy to get wrong. Its directive extends `TuiControl`,
 * so it injects `NgControl` and a binding is **mandatory** — without `ngModel` it throws on
 * construction. And its value is only the most recent pick, never the accumulated list, so the
 * binding here is a throwaway that is emptied the moment the files are handed over: the ordered
 * list belongs to the host, and leaving the picker holding a value would make the dropzone render a
 * second, stale copy of it.
 *
 * The dropzone's own copy and the reasons a file was rejected come from `@taiga-ui/i18n`, already in
 * the build's language. They are not re-translated here.
 */
@Component({
  selector: 'app-space-photo-editor',
  imports: [FormsModule, SpacePhotoRow, TuiFiles],
  templateUrl: './space-photo-editor.html',
  styleUrl: './space-photo-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpacePhotoEditor {
  public readonly photos = input.required<readonly PhotoItem[]>();
  public readonly disabled = input(false);
  /** How many more the space may hold; the dropzone closes when it reaches zero. */
  public readonly remaining = input(Number.POSITIVE_INFINITY);

  public readonly filesPicked = output<readonly File[]>();
  public readonly moved = output<PhotoMove>();
  public readonly coverSet = output<string>();
  public readonly removed = output<string>();

  protected readonly accept = ACCEPTED_TYPES;
  protected readonly maxFileSize = MAX_FILE_SIZE;

  /** Bound to the picker and emptied immediately; see the class comment. */
  protected readonly picked = signal<readonly File[] | null>(null);

  protected readonly rejected = signal<readonly File[]>([]);

  protected readonly full = computed(() => this.remaining() <= 0);

  /**
   * Announced after every reordering. Without it, somebody using a screen reader presses "move up"
   * and hears nothing at all, which is indistinguishable from a broken button — the `<ol>` conveys
   * position to the accessibility tree, but not that it just changed.
   */
  protected readonly announcement = signal('');

  protected onPicked(files: readonly File[] | null): void {
    const chosen = files ?? [];

    this.picked.set(null);

    if (chosen.length > 0) {
      this.rejected.set([]);
      this.filesPicked.emit(chosen);
    }
  }

  protected onRejected(files: readonly File[]): void {
    this.rejected.set(files);
  }

  protected move(from: number, to: number): void {
    this.moved.emit({ from, to });
    this.announce(to);
  }

  protected setCover(id: string): void {
    this.coverSet.emit(id);
    this.announce(0);
  }

  private announce(position: number): void {
    this.announcement.set(
      $localize`:@@admin.spacePhotos.announce:Foto ${position + 1} de ${this.photos().length}. La portada es la foto 1.`,
    );
  }
}
