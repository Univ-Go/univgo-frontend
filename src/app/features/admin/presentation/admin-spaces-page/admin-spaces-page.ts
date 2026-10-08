import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
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
 * It is also where the catalogue is managed from, so the grid gained a way to create a space and
 * each card a way to edit one. There is no second list: a separate management screen would be a
 * second answer to "which spaces exist".
 *
 * Archived spaces are kept in their own section at the end rather than mixed in. They are not part
 * of the campus any more, but they have to be reachable: restoring one lives on its edit screen, and
 * without a way in it would need SQL on a shared database.
 */
@Component({
  selector: 'app-admin-spaces-page',
  imports: [AdminSpaceCard, EmptyState, RouterLink, TuiButton, TuiSkeleton],
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

  protected readonly active = computed(() =>
    this.spaces.value().filter((space) => !space.archived),
  );

  protected readonly archived = computed(() =>
    this.spaces.value().filter((space) => space.archived),
  );

  protected readonly skeletonCards = SKELETON_CARDS;

  protected retry(): void {
    this.store.refresh();
    this.spaces.reload();
  }
}
