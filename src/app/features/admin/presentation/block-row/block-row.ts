import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiAppearance, TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiBadge, TuiProgressBar } from '@taiga-ui/kit';
import { TuiSurface } from '@taiga-ui/layout';
import type { CapacityBlock } from '../../domain/attendance';
import { occupancyOf } from '../../domain/attendance-roster';
import {
  blockKeyOf,
  blockPhaseOf,
  fullnessBandOf,
  occupancyLoadOf,
} from '../../domain/block-schedule';
import { BLOCK_PHASE_LABELS } from '../block-phase-copy';
import { BlockStatusBadge } from '../block-status-badge/block-status-badge';

/**
 * Level 3: one block of the day's schedule, as the row the administrator reads across.
 *
 * What it shows changes with the clock, and that is the point of the view rather than a flourish: a
 * block still to come can report only what has been booked, one in progress reports who is in the
 * room and who has yet to walk in, and one that is over reports who turned up. The meter keeps the
 * same meaning across the first two — seats held out of capacity — and changes to attendance in the
 * third, which is exactly what the heading above it changes to license.
 *
 * The whole row is deliberately not a link. It carries a button, and a link wrapping a button is
 * nested interactive content; the mock asks for the explicit action anyway.
 */
@Component({
  selector: 'app-block-row',
  imports: [
    BlockStatusBadge,
    DatePipe,
    RouterLink,
    TuiAppearance,
    TuiBadge,
    TuiButton,
    TuiIcon,
    TuiProgressBar,
    TuiSurface,
  ],
  templateUrl: './block-row.html',
  styleUrl: './block-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockRow {
  public readonly block = input.required<CapacityBlock>();
  /** Passed in rather than read here, so the whole list agrees on one instant and stays testable. */
  public readonly now = input.required<Date>();
  /** Carried through to the detail's address so returning lands back on this same day; the space is
   *  already part of both routes' shared `:spaceId` prefix and needs no carrying. */
  public readonly day = input.required<string>();

  protected readonly occupancy = computed(() => occupancyOf(this.block()));
  protected readonly phase = computed(() => blockPhaseOf(this.block(), this.now()));
  protected readonly band = computed(() => fullnessBandOf(this.occupancy()));

  /**
   * `null` once the block is over. The meter stops measuring pressure and starts reporting
   * attendance, where a high figure is the good outcome — colouring 95 % of students turning up as
   * a saturated room would invert the reading.
   */
  protected readonly load = computed(() =>
    this.phase() === 'past' ? null : occupancyLoadOf(this.occupancy()),
  );
  protected readonly key = computed(() => blockKeyOf(this.block()));

  protected readonly capacityLabel = computed(() => BLOCK_PHASE_LABELS[this.phase()]);

  /** The denominator of a finished block is who was expected to come, not the room's capacity: a
   *  seat nobody booked was never a no-show. Cancellations are in neither half (§7). */
  protected readonly expected = computed(() => this.occupancy().attended + this.occupancy().missed);

  protected readonly shown = computed(() =>
    this.phase() === 'past' ? this.occupancy().attended : this.occupancy().occupied,
  );

  protected readonly total = computed(() =>
    this.phase() === 'past' ? this.expected() : this.occupancy().capacity,
  );

  protected readonly ratio = computed(() => {
    if (this.phase() !== 'past') {
      return this.occupancy().ratio;
    }

    // A block nobody booked is not zero attendance, it is no attendance to report: an empty meter
    // would read as everyone having failed to turn up.
    return this.expected() > 0 ? this.occupancy().attended / this.expected() : 0;
  });
}
