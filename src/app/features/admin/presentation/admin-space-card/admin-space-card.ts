import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiAppearance, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { MediaPlate } from '../../../../shared/media-plate/media-plate';
import type { AdminSpace } from '../../domain/attendance';

/**
 * Level 2: one space in the panel's entry grid. Follows the student-facing `SpaceCard`'s structural
 * pattern (`TuiCardLarge` + `TuiSurface` + `MediaPlate`), but stays to what `AdminSpace` actually
 * carries — a name and a capacity, no location or category — and the whole card is the link rather
 * than a bottom button, since there is nothing to compare here, only one destination per card.
 */
@Component({
  selector: 'app-admin-space-card',
  imports: [MediaPlate, RouterLink, TuiAppearance, TuiCardLarge, TuiIcon, TuiSurface],
  templateUrl: './admin-space-card.html',
  styleUrl: './admin-space-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSpaceCard {
  public readonly space = input.required<AdminSpace>();
}
