import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { TuiSizeS, TuiSizeXL } from '@taiga-ui/core/types';
import { TuiBadge } from '@taiga-ui/kit';
import type { ReservationStatus } from '../../domain/reservation';

/**
 * Level 2: the status flag repeats identically on the reservation card and the reservation detail
 * view, so the appearance/icon/text mapping per status lives once here instead of twice.
 */
@Component({
  selector: 'app-reservation-status-badge',
  imports: [TuiBadge],
  templateUrl: './reservation-status-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationStatusBadge {
  public readonly status = input.required<ReservationStatus>();
  public readonly size = input<TuiSizeS | TuiSizeXL>('m');
}
