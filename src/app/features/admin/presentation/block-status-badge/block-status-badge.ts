import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { TuiSizeS, TuiSizeXL } from '@taiga-ui/core/types';
import { TuiBadge } from '@taiga-ui/kit';
import type { BlockPhase, FullnessBand } from '../../domain/block-schedule';

/**
 * Level 2: how full a block is, in the three words the desk answers "¿queda sitio?" with — and a
 * fourth for a block that is over, where none of the three is true any more. "Disponible" on a block
 * that finished three hours ago would be the panel asserting something it cannot know, which is the
 * whole reason the schedule reads the clock at all.
 *
 * Same shape as `AttendeeStatusBadge`, and for the same reason: every band carries an icon and a
 * word, so nothing here rests on colour alone.
 */
@Component({
  selector: 'app-block-status-badge',
  imports: [TuiBadge],
  templateUrl: './block-status-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockStatusBadge {
  public readonly band = input.required<FullnessBand>();
  public readonly phase = input.required<BlockPhase>();
  public readonly size = input<TuiSizeS | TuiSizeXL>('m');
}
