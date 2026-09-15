import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MOCK_SPACE_PROFILES } from '../../infrastructure/mock-attendance';
import { AdminSpaceCard } from '../admin-space-card/admin-space-card';

/**
 * The panel's entry point (`docs/booking-flow.md` §11: an administrator manages several spaces, and
 * everything else is always about one of them). Picking a card opens that space's scanner — always,
 * never a remembered last section — which keeps the grid a plain choice rather than a second kind of
 * navigation history to reason about.
 *
 * `MOCK_SPACE_PROFILES` resolves synchronously and is never empty, so there is no loading or empty
 * state to build here; both would simulate a failure mode a mock can't produce. Revisit once a real
 * port replaces it.
 */
@Component({
  selector: 'app-admin-spaces-page',
  imports: [AdminSpaceCard],
  templateUrl: './admin-spaces-page.html',
  styleUrl: './admin-spaces-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSpacesPage {
  protected readonly spaces = MOCK_SPACE_PROFILES;
}
