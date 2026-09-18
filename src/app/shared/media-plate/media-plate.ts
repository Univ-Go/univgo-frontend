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
 * Uploaded photos arrive as full camera-resolution files (multi-megapixel, several hundred KB) with
 * no cache header — the upload pipeline has no resizing step yet. Rather than ship that weight to a
 * thumbnail, `imageUrl` is routed through the Netlify Image CDN (`/.netlify/images?url=...&w=...`),
 * which resizes and caches it at the edge; `width` is how large the host actually renders it. Local
 * dev has no Image CDN to answer that path, so a 404 there falls back to the original URL once —
 * slower, but the same behaviour the app had before this existed, not a broken plate.
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
        [src]="displayUrl()"
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
  /** The largest CSS pixel size this host ever renders the photo at; a card and a banner differ. */
  public readonly width = input(640);

  protected readonly loadedSrc = signal<string | null>(null);
  private readonly proxyFailed = signal(false);

  protected readonly displayUrl = computed(() => {
    const src = this.imageUrl();

    if (!src) {
      return null;
    }

    if (this.proxyFailed()) {
      return src;
    }

    const params = new URLSearchParams({ url: src, w: String(this.width()) });

    return `/.netlify/images?${params}`;
  });

  protected readonly loaded = computed(() => this.loadedSrc() === this.displayUrl());

  constructor() {
    effect(() => {
      this.imageUrl();
      this.proxyFailed.set(false);
      this.loadedSrc.set(null);
    });
  }

  protected onLoad(): void {
    this.loadedSrc.set(this.displayUrl());
  }

  protected onError(): void {
    if (this.proxyFailed()) {
      this.loadedSrc.set(this.displayUrl());

      return;
    }

    this.proxyFailed.set(true);
  }
}
