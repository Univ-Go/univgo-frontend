import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';

/**
 * Level 1: the brand plate that stands in for a space photo until real images exist. Every view
 * that shows a space hero was carrying its own copy of the same gradient, radius and icon size, so
 * the placeholder is one component and the day the photos arrive is one file.
 *
 * The aspect ratio is a default, not a rule: the host element belongs to the consumer's template,
 * so a view that needs a different frame overrides it there.
 */
@Component({
  selector: 'app-media-plate',
  imports: [TuiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--tui-radius-l);
      background:
        radial-gradient(circle at 30% 20%, rgb(255 255 255 / 14%), transparent 55%),
        var(--univgo-brand-surface);
      aspect-ratio: 21 / 9;
    }

    tui-icon {
      color: var(--univgo-on-brand-surface);
      font-size: 3rem;
      opacity: 0.9;
    }
  `,
  template: `<tui-icon [icon]="icon()" aria-hidden="true" />`,
})
export class MediaPlate {
  public readonly icon = input.required<string>();
}
