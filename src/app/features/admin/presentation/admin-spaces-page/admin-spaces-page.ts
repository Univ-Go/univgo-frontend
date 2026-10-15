import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiInput } from '@taiga-ui/core';
import { TuiAccordion, TuiSkeleton } from '@taiga-ui/kit';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { matchesQuery } from '../../../../shared/text/search-text';
import { AdminSpacesStore } from '../../application/admin-spaces.store';
import type { AdminSpaceSummary } from '../../domain/admin-space-detail';
import { AdminSpaceCard } from '../admin-space-card/admin-space-card';

/** Placeholder cards drawn while the catalogue loads: a screenful, not the whole page. */
const SKELETON_CARDS = Array.from({ length: 3 }, (_, index) => index);

function searchableText(space: AdminSpaceSummary): string {
  return `${space.name} ${space.location} ${space.spaceTypeName}`;
}

/**
 * The panel's entry point (`docs/booking-flow.md` §11: an administrator manages several spaces, and
 * everything else is always about one of them). Each card opens the section wanted directly instead
 * of always landing on the scanner, and a search narrows the grid so a space can be found by name
 * rather than by scrolling.
 *
 * It is also where the catalogue is managed from, so the grid carries a way to create a space and
 * each card a way to edit one. There is no second list: a separate management screen would be a
 * second answer to "which spaces exist".
 *
 * Archived spaces fold away at the end rather than mixing in. They are not part of the campus any
 * more, but they have to be reachable: restoring one lives on its edit screen, and without a way in
 * it would need SQL on a shared database.
 */
@Component({
  selector: 'app-admin-spaces-page',
  imports: [
    AdminSpaceCard,
    EmptyState,
    FormsModule,
    RouterLink,
    TuiAccordion,
    TuiButton,
    TuiInput,
    TuiSkeleton,
  ],
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

  protected readonly query = signal('');

  private readonly matching = computed(() =>
    this.spaces.value().filter((space) => matchesQuery(searchableText(space), this.query())),
  );

  protected readonly active = computed(() => this.matching().filter((space) => !space.archived));

  protected readonly archived = computed(() => this.matching().filter((space) => space.archived));

  protected readonly skeletonCards = SKELETON_CARDS;

  protected retry(): void {
    this.store.refresh();
    this.spaces.reload();
  }
}
