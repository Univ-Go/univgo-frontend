import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';
import { TuiSkeleton } from '@taiga-ui/kit';

/**
 * Level 1: the brand plate that stands in for a space photograph until real images exist. The
 * reservation card, the space card and the reservation detail all showed one, and all three drew it
 * themselves — same gradient, same ink, three copies to keep in step, and three places to change
 * the day the photographs arrive.
 *
 * The surface that hosts the plate decides its proportions through custom properties rather than
 * through a variant flag: a card frames a picture, the detail view runs it as a banner, and neither
 * is a different plate.
 *
 * Anything projected into it lands over the plate's far corner, which is where the catalogue puts
 * the availability pill: it is the first thing the eye looks for when scanning a shelf.
 *
 * `imageUrl` is what "the day the photographs arrive" turned into. A photo is never shown mid-load:
 * the plate holds a skeleton until the browser has it fully decoded, then swaps straight to the
 * finished image with no transition — the alternative, letting the brand gradient show through
 * while the image streams in, read as a red flash popping into a photo. `alt=""` is deliberate: the
 * space name already sits next to the plate as text, so the image is decorative to a screen reader.
 *
 * **No image optimizer sits in front of this, and the plate does not choose a size.** The server
 * resizes a photograph on upload and publishes one URL per width; picking which one belongs to the
 * surface that knows how large it renders — `photoUrl` in the spaces domain. Routing these through
 * the platform optimizer was worse than useless: the URLs are signed and rotate every 55 minutes,
 * so every rotation was a cache miss and a billed transformation of an image that was already the
 * right size.
 *
 * A `blob:` from `URL.createObjectURL` works here unchanged, which is what lets the creation wizard
 * preview a file that has not been uploaded yet.
 */
@Component({
  selector: 'app-media-plate',
  imports: [TuiIcon, TuiSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      --media-plate-ratio: 16 / 9;
      --media-plate-radius: var(--tui-radius-m);
      --media-plate-mark-size: 2rem;
      --media-plate-align: flex-end;
      --media-plate-justify: flex-start;

      display: flex;
      position: relative;
      justify-content: var(--media-plate-justify);
      align-items: var(--media-plate-align);
      overflow: hidden;
      padding: var(--univgo-space-s);
      border-radius: var(--media-plate-radius);
      background:
        radial-gradient(circle at 30% 20%, rgb(255 255 255 / 14%), transparent 55%),
        var(--univgo-brand-surface);
      aspect-ratio: var(--media-plate-ratio);
    }

    .photo {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      object-fit: cover;
    }

    .photo--pending {
      visibility: hidden;
    }

    .mark {
      color: var(--univgo-on-brand-surface);
      font-size: var(--media-plate-mark-size);
      opacity: 0.9;
    }

    .overlay {
      position: absolute;
      inset-block-start: var(--univgo-space-s);
      inset-inline-end: var(--univgo-space-s);
    }

    .overlay:empty {
      display: none;
    }
  `,
  template: `
    @if (imageUrl(); as src) {
      @if (!loaded()) {
        <div class="photo" [tuiSkeleton]="true"></div>
      }
      <img
        class="photo"
        [class.photo--pending]="!loaded()"
        [src]="src"
        alt=""
        loading="lazy"
        decoding="async"
        (load)="onLoad()"
        (error)="onError()"
      />
    } @else {
      <tui-icon class="mark" [icon]="icon()" aria-hidden="true" />
    }

    <div class="overlay">
      <ng-content />
    </div>
  `,
})
export class MediaPlate {
  public readonly icon = input.required<string>();
  public readonly imageUrl = input<string | null>(null);

  private readonly loadedSrc = signal<string | null>(null);

  protected readonly loaded = computed(() => this.loadedSrc() === this.imageUrl());

  constructor() {
    effect(() => {
      this.imageUrl();
      this.loadedSrc.set(null);
    });
  }

  protected onLoad(): void {
    this.loadedSrc.set(this.imageUrl());
  }

  /**
   * A photograph that will not load would leave the skeleton showing forever, which reads as a
   * stuck page. Treating the failure as settled shows the browser's own broken-image state, which
   * is at least honest.
   */
  protected onError(): void {
    this.loadedSrc.set(this.imageUrl());
  }
}
