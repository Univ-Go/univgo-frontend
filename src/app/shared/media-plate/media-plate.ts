import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';

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
 * `imageUrl` is what "the day the photographs arrive" turned into: a space with one still renders
 * the brand gradient underneath (the image can be slow, transparent, or fail to load — the plate
 * never turns blank), and paints the photograph over it. `alt=""` is deliberate: the space name
 * already sits next to the plate as text, so the image is decorative to a screen reader.
 */
@Component({
  selector: 'app-media-plate',
  imports: [TuiIcon],
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
      <img class="photo" [src]="src" alt="" loading="lazy" decoding="async" />
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
}
