import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiAppearance, TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiBadge } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { MediaPlate } from '../../../../shared/media-plate/media-plate';
import type { AdminSpaceSummary } from '../../domain/admin-space-detail';

/**
 * Level 2: one space in the panel's entry grid.
 *
 * The card used to be a single anchor to the scanner. It now carries a second destination — editing
 * the space — and an anchor cannot be nested inside an anchor, so the card is an `article` whose
 * heading holds the primary link and whose stylesheet extends that link's hit area over the whole
 * surface. Same shape as the student-facing `SpaceCard`, and the edit button sits above the overlay
 * so it stays clickable.
 *
 * An archived space has no scanner to open — the server refuses an archived space everywhere it
 * would be used — so for one the only destination is the edit screen, where it can be restored.
 */
@Component({
  selector: 'app-admin-space-card',
  imports: [
    MediaPlate,
    RouterLink,
    TuiAppearance,
    TuiBadge,
    TuiButton,
    TuiCardLarge,
    TuiIcon,
    TuiSurface,
  ],
  templateUrl: './admin-space-card.html',
  styleUrl: './admin-space-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSpaceCard {
  public readonly space = input.required<AdminSpaceSummary>();

  protected readonly editLink = computed(() => ['/admin', 'spaces', this.space().spaceId, 'edit']);

  protected readonly scanLink = computed(() =>
    this.space().archived ? null : ['/admin', this.space().spaceId, 'scan'],
  );

  /**
   * A space the catalogue would show as permanently shut: without an opening window
   * `BlockGenerator` produces nothing to reserve. Worth saying on the card, because the grid is
   * where somebody notices.
   */
  protected readonly missingSchedule = computed(() => this.space().scheduleWindowCount === 0);

  protected readonly missingPhotos = computed(() => this.space().imageCount === 0);
}
