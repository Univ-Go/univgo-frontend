import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TuiAppearance, TuiIcon } from '@taiga-ui/core';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';

/**
 * Level 3: one number about the current block, with the one line of context that makes it
 * actionable. Two of the panel's three summary tiles are this same shape, differing only in what
 * they count and in the tone the icon carries.
 *
 * The footnote is projected rather than an input: it is the only copy here that needs a plural, and
 * an ICU message has to live in a template. What the card owns is the row it sits in — its colour
 * and size are inherited, which is what reaches projected text through style encapsulation — and
 * the icon in front of it, which is not text and would not inherit anything.
 */
@Component({
  selector: 'app-metric-card',
  imports: [TuiAppearance, TuiAvatar, TuiCardLarge, TuiIcon, TuiSurface],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }

    .metric {
      display: flex;
      flex-direction: column;
      align-items: start;
      gap: var(--univgo-space-s);
      block-size: 100%;
    }

    .metric__heading {
      font: var(--tui-typography-heading-h6);
    }

    .metric__value {
      font: var(--tui-typography-heading-h4);
      font-variant-numeric: tabular-nums;
      letter-spacing: var(--univgo-letter-spacing-tight);
    }

    .metric__hint {
      display: flex;
      align-items: center;
      gap: var(--univgo-space-xs);
      margin: 0;
      color: var(--tui-text-tertiary);
      font: var(--tui-typography-ui-xs);
    }

    .metric__hint tui-icon {
      font-size: var(--univgo-icon-inline);
    }

    .metric__hint:empty {
      display: none;
    }
  `,
  template: `
    <article tuiCardLarge tuiSurface tuiAppearance="outline" class="metric">
      <span [tuiAvatar]="icon()" size="m" [tuiAppearance]="tone()" aria-hidden="true"></span>

      <h2 class="metric__heading">{{ heading() }}</h2>

      <p class="metric__value">{{ value() }}</p>

      <p class="metric__hint">
        @if (hintIcon(); as hint) {
          <tui-icon [icon]="hint" aria-hidden="true" />
        }
        <ng-content />
      </p>
    </article>
  `,
})
export class MetricCard {
  public readonly icon = input.required<string>();
  public readonly heading = input.required<string>();
  public readonly value = input.required<number | string>();
  /** A Taiga appearance, which is what carries "this is good news" without a word for it. */
  public readonly tone = input<string>('neutral');
  public readonly hintIcon = input<string | null>(null);
}
