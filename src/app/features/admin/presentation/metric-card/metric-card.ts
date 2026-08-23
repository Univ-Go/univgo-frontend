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
  templateUrl: './metric-card.html',
  styleUrl: './metric-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricCard {
  public readonly icon = input.required<string>();
  public readonly heading = input.required<string>();
  public readonly value = input.required<number | string>();
  /** A Taiga appearance, which is what carries "this is good news" without a word for it. */
  public readonly tone = input<string>('neutral');
  public readonly hintIcon = input<string | null>(null);
  /** 'start' keeps the roster-adjacent metrics left-aligned; 'center' suits a standalone stat tile. */
  public readonly align = input<'start' | 'center'>('start');
  /** Overrides the icon size `align` would otherwise imply, for a tile that needs more visual weight. */
  public readonly iconSize = input<'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl'>();
}
