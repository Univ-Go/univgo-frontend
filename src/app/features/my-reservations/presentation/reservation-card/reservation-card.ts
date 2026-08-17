import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiAppearance, TuiButton, TuiIcon, TuiLink } from '@taiga-ui/core';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { spaceCategoryIcon } from '../../../spaces/presentation/space-category';
import type { Reservation } from '../../domain/reservation';
import { ReservationStatusBadge } from '../reservation-status-badge/reservation-status-badge';

/**
 * Feature-level card: every view that lists reservations renders the same summary, so the status
 * badge mapping and the action bar live in one place rather than being copied per view. It stays
 * inside `my-reservations` until a second feature needs it; the home view's "next reservation" is a
 * different composition, not this card with flags.
 *
 * Cancel and QR carry no handler yet: each is its own future use case (cancel-reservation, view-qr)
 * once there is an API to call, and outputs nobody listens to would be dead code today.
 */
@Component({
  selector: 'app-reservation-card',
  imports: [
    DatePipe,
    ReservationStatusBadge,
    RouterLink,
    TuiAppearance,
    TuiButton,
    TuiCardLarge,
    TuiIcon,
    TuiLink,
    TuiSurface,
  ],
  templateUrl: './reservation-card.html',
  styleUrl: './reservation-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationCard {
  public readonly reservation = input.required<Reservation>();

  protected readonly icon = computed(() => spaceCategoryIcon(this.reservation().category));
}
