import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { TuiSizeS, TuiSizeXL } from '@taiga-ui/core/types';
import { TuiBadge } from '@taiga-ui/kit';
import type { CheckInStatus } from '../../domain/attendance';

/**
 * Level 2: the flag a student's row carries. It reads the reservation's own five states rather than
 * a panel-specific vocabulary, so the word on the administrator's screen and the word on the
 * student's cannot describe the same reservation differently.
 *
 * Two states share the neutral appearance because for the space they are the same outcome — the seat
 * came back — and the icon is what tells them apart, so nothing here rests on colour alone.
 */
@Component({
  selector: 'app-attendee-status-badge',
  imports: [TuiBadge],
  templateUrl: './attendee-status-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendeeStatusBadge {
  public readonly status = input.required<CheckInStatus>();
  public readonly size = input<TuiSizeS | TuiSizeXL>('m');
}
