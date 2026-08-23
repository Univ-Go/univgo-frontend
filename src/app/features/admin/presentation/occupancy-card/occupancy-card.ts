import { DecimalPipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TuiAppearance } from '@taiga-ui/core';
import { TuiProgressBar } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import type { BlockOccupancy } from '../../domain/attendance';

/**
 * Level 3: how full the block is. The panel's first question — "is there room?" — answered as the
 * two numbers it actually decomposes into, plus the meter that makes the ratio readable at a glance
 * from behind a desk.
 *
 * Free seats are shown in the palette's "available" teal and taken ones in the brand crimson, but
 * each still carries its own word: the pair has to read for someone who cannot tell the two hues
 * apart.
 */
@Component({
  selector: 'app-occupancy-card',
  imports: [DecimalPipe, PercentPipe, TuiAppearance, TuiCardLarge, TuiProgressBar, TuiSurface],
  templateUrl: './occupancy-card.html',
  styleUrl: './occupancy-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OccupancyCard {
  public readonly occupancy = input.required<BlockOccupancy>();
}
