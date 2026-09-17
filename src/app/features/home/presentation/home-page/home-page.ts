import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TuiAppearance, TuiIcon, TuiLink, TuiTitle } from '@taiga-ui/core';
import { TuiButton } from '@taiga-ui/core';
import { TuiSkeleton } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader, TuiSurface } from '@taiga-ui/layout';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { SessionStore } from '../../../auth/application/session-store';
import { findNextReservation } from '../../../my-reservations/domain/reservation-catalog';
import { MOCK_RESERVATIONS } from '../../../my-reservations/infrastructure/mock-reservations';
import { ReservationStatusBadge } from '../../../my-reservations/presentation/reservation-status-badge/reservation-status-badge';
import { SpaceRepository } from '../../../spaces/domain/space.repository';
import { listSpaces } from '../../../spaces/domain/space-catalog';
import { SpaceCard } from '../../../spaces/presentation/space-card/space-card';
import { spaceCategoryIcon } from '../../../spaces/presentation/space-category';

const FEATURED_SPACES = 3;

const SKELETON_CARDS = Array.from({ length: FEATURED_SPACES }, (_, index) => index);

/**
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
    TuiSkeleton,
    TuiSurface,
    TuiTitle,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly session = inject(SessionStore);
  private readonly spaces = inject(SpaceRepository);

  protected readonly userName = computed(() => this.session.user()?.firstName ?? '');

  protected readonly categoryIcon = spaceCategoryIcon;

  protected readonly nextReservation = findNextReservation(MOCK_RESERVATIONS);

  /** Read once: home is opened and left, and a day that changed under the user would be noise. */
  private readonly today = new Date();

  protected readonly catalog = rxResource({
    params: () => this.today,
    stream: ({ params }) => this.spaces.catalog(params),
    defaultValue: [],
  });

  protected readonly skeletonCards = SKELETON_CARDS;

  /** What the catalogue would put first today: free spaces before busy ones, then by name. */
  protected readonly featuredSpaces = computed(() =>
    listSpaces(this.catalog.value(), {
      category: null,
      date: this.today,
      from: null,
      query: null,
    }).slice(0, FEATURED_SPACES),
  );
}
