import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiAppearance, TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { ADMIN_NAV_ITEMS } from '../../../../layout/admin-nav-items';
import { MediaPlate } from '../../../../shared/media-plate/media-plate';
import type { AdminSpaceSummary } from '../../domain/admin-space-detail';

/**
 * How many of the panel's sections get a labelled button on the card; the rest sit as icons in the
 * photo's corner. Two is what fits side by side on a phone without the labels truncating.
 */
const DIRECT_SECTIONS = 2;

/**
 * Level 2: one space in the panel's entry grid.
 *
 * The photo stays large because it is how an administrator spots a space at a glance, before reading
 * any name. What changed is where a card leads: it used to be a single link to the scanner, so
 * reaching a space's occupancy took a second, invisible step. The card now names the panel's
 * sections directly, with the same labels and icons as the bar's tabs they land on — they are read
 * from the same `ADMIN_NAV_ITEMS` — so somebody who taps "Ocupación" here finds "Ocupación"
 * highlighted there.
 *
 * An archived space has no section to open — the server refuses an archived space everywhere it
 * would be used — so for one the only destination is its settings, where it can be restored.
 */
@Component({
  selector: 'app-admin-space-card',
  imports: [MediaPlate, RouterLink, TuiAppearance, TuiButton, TuiCardLarge, TuiIcon, TuiSurface],
  templateUrl: './admin-space-card.html',
  styleUrl: './admin-space-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSpaceCard {
  public readonly space = input.required<AdminSpaceSummary>();

  protected readonly directSections = ADMIN_NAV_ITEMS.slice(0, DIRECT_SECTIONS);
  protected readonly cornerSections = ADMIN_NAV_ITEMS.slice(DIRECT_SECTIONS);

  protected readonly editLink = computed(() => ['/admin', 'spaces', this.space().spaceId, 'edit']);

  /**
   * Where a tap anywhere on the card leads: the first section, which is the one drawn as the filled
   * button. An archived space has no section to open, so its card leads to the edit screen — its only
   * destination — rather than leaving a surface that answers the pointer and does nothing.
   */
  protected readonly primaryLink = computed(() => {
    const link = this.directSections[0]?.link;

    return this.space().archived || !link ? this.editLink() : this.sectionLink(link);
  });

  /**
   * A space the catalogue would show as permanently shut: without an opening window
   * `BlockGenerator` produces nothing to reserve. Worth saying on the card, because the grid is
   * where somebody notices.
   */
  protected readonly missingSchedule = computed(() => this.space().scheduleWindowCount === 0);

  protected readonly missingPhotos = computed(() => this.space().imageCount === 0);

  protected sectionLink(section: string): string[] {
    return ['/admin', this.space().spaceId, section];
  }
}
