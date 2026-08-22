import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { TuiSizeS, TuiSizeXL } from '@taiga-ui/core/types';
import { TuiBadge } from '@taiga-ui/kit';
import type { ClosureStatus } from '../../domain/space-closure';

/**
 * Level 2: the flag a closure row carries. Reuses the same appearance-per-outcome mapping as
 * `AttendeeStatusBadge` — warning for what has not started, positive for what is happening now,
 * neutral for what is over — so "in effect" reads the same colour everywhere in the panel.
 */
@Component({
  selector: 'app-closure-status-badge',
  imports: [TuiBadge],
  templateUrl: './closure-status-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClosureStatusBadge {
  public readonly status = input.required<ClosureStatus>();
  public readonly size = input<TuiSizeS | TuiSizeXL>('m');
}
