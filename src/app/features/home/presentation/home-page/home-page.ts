import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiAppearance, TuiIcon, TuiLink, TuiTitle } from '@taiga-ui/core';
import { TuiButton } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader, TuiSurface } from '@taiga-ui/layout';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { findNextReservation } from '../../../my-reservations/domain/reservation-catalog';
import { MOCK_RESERVATIONS } from '../../../my-reservations/infrastructure/mock-reservations';
import { ReservationStatusBadge } from '../../../my-reservations/presentation/reservation-status-badge/reservation-status-badge';
import { listSpaces } from '../../../spaces/domain/space-catalog';
import { MOCK_SPACES } from '../../../spaces/infrastructure/mock-spaces';
import { SpaceCard } from '../../../spaces/presentation/space-card/space-card';
import { spaceCategoryIcon } from '../../../spaces/presentation/space-category';

const FEATURED_SPACES = 3;

/**
 * Visual mock: layout and component inventory are final, the data is not.
 *
 * Home is a composition of the features it links to, not a place with surfaces of its own: the
 * booking is the one `findNextReservation` picks and wears `ReservationStatusBadge`, the spaces
 * come from the catalogue ranked by the same domain function the catalogue uses, and each one is a
 * `SpaceCard`. A dashboard that redraws those cards is how a second status badge and a second card
 * width get into the product; there is nothing to keep in step this way.
 */
@Component({
  selector: 'app-home-page',
  imports: [
    DatePipe,
    EmptyState,
    ReservationStatusBadge,
    RouterLink,
    SpaceCard,
    TuiAppearance,
    TuiButton,
    TuiCardLarge,
    TuiHeader,
    TuiIcon,
    TuiLink,
    TuiSurface,
    TuiTitle,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  /** Mock: the signed-in user arrives from the session once authentication exists. */
  protected readonly userName = 'Mateo';

  protected readonly categoryIcon = spaceCategoryIcon;

  protected readonly nextReservation = findNextReservation(MOCK_RESERVATIONS);

  /** What the catalogue would put first today: free spaces before busy ones, then by name. */
  protected readonly featuredSpaces = listSpaces(MOCK_SPACES, {
    category: null,
    date: new Date(),
    from: null,
    to: null,
  }).slice(0, FEATURED_SPACES);
}
