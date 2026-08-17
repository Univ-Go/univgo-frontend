import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TuiAppearance, TuiButton, TuiIcon, TuiLink } from '@taiga-ui/core';
import { TuiBadge } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import type { Reservation, SpaceCategory } from '../../domain/reservation';

/**
 * Which icon stands for a category is presentation, not domain, so the map lives here instead of
 * travelling with the reservation itself.
 */
const CATEGORY_ICONS: Readonly<Record<SpaceCategory, string>> = {
  sports: '@tui.volleyball',
  study: '@tui.book-open',
  lab: '@tui.flask-conical',
};

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
    TuiAppearance,
    TuiBadge,
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

  protected readonly icon = computed(() => CATEGORY_ICONS[this.reservation().category]);
}
