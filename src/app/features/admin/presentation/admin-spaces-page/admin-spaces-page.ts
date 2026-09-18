import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TuiButton } from '@taiga-ui/core';
import { TuiSkeleton } from '@taiga-ui/kit';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { AdminSpacesStore } from '../../application/admin-spaces.store';
import { AdminSpaceCard } from '../admin-space-card/admin-space-card';

/** Placeholder cards drawn while the catalogue loads: a screenful, not the whole page. */
const SKELETON_CARDS = Array.from({ length: 3 }, (_, index) => index);

/**
 * The panel's entry point (`docs/booking-flow.md` §11: an administrator manages several spaces, and
 * everything else is always about one of them). Picking a card opens that space's scanner — always,
 * never a remembered last section — which keeps the grid a plain choice rather than a second kind of
 * navigation history to reason about.
 *
 * The spaces are the campus's own, read through `AdminSpacesStore`, so the ids in the panel's URLs
 * are the ones the check-in endpoint answers about.
 */
@Component({
  selector: 'app-admin-spaces-page',
  imports: [AdminSpaceCard, EmptyState, TuiButton, TuiSkeleton],
  templateUrl: './admin-spaces-page.html',
  styleUrl: './admin-spaces-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSpacesPage {
  private readonly store = inject(AdminSpacesStore);

  protected readonly spaces = rxResource({
    stream: () => this.store.list(),
    defaultValue: [],
  });

  protected readonly skeletonCards = SKELETON_CARDS;

  protected retry(): void {
    this.store.refresh();
    this.spaces.reload();
  }
}
