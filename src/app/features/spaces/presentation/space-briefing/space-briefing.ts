import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TuiList } from '@taiga-ui/layout';

/**
 * Level 2: what a space says about itself — what it is for, and what a student must read before
 * booking it. The catalogue's detail view, both steps of the booking flow and the reservation pass
 * all show it, and all four drew it themselves: the same heading, the same list, four copies to
 * keep in step.
 *
 * It renders the blocks and not the card around them, so the view that hosts it keeps deciding
 * where the card sits in its own grid. Either block is dropped when there is nothing to put in it:
 * a space whose rules nobody has written yet is a real state, not an empty section.
 *
 * The text is an administrator's, not the product's, so it never travels through i18n — only the
 * headings do. It arrives in whatever language it was written in, like the name and the location.
 */
@Component({
  selector: 'app-space-briefing',
  imports: [TuiList],
  templateUrl: './space-briefing.html',
  styleUrl: './space-briefing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceBriefing {
  public readonly description = input('');
  public readonly rules = input<readonly string[]>([]);
}
