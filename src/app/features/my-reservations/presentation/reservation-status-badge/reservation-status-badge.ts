import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { TuiSizeS, TuiSizeXL } from '@taiga-ui/core/types';
import { TuiBadge } from '@taiga-ui/kit';
import type { ReservationState } from '../../domain/reservation';

/**
 * Level 2: the state flag repeats identically on the reservation card and the reservation detail
 * view, so the appearance/icon/text mapping per state lives once here instead of twice.
 */
@Component({
  selector: 'app-reservation-status-badge',
  imports: [TuiBadge],
  templateUrl: './reservation-status-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationStatusBadge {
  public readonly state = input.required<ReservationState>();
  public readonly size = input<TuiSizeS | TuiSizeXL>('m');
}
