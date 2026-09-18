import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiAppearance, TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiBadge, TuiProgressBar } from '@taiga-ui/kit';
import { TuiSurface } from '@taiga-ui/layout';
import type { AdminBlock } from '../../domain/attendance';
import { blockLoadOf } from '../../domain/attendance-roster';
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
  public readonly block = input.required<AdminBlock>();
  /** Passed in rather than read here, so the whole list agrees on one instant and stays testable. */
  public readonly now = input.required<Date>();
  /** Carried through to the detail's address so returning lands back on this same day; the space is
   *  already part of both routes' shared `:spaceId` prefix and needs no carrying. */
  public readonly day = input.required<string>();

  protected readonly occupancy = computed(() => blockLoadOf(this.block()));
  protected readonly phase = computed(() => blockPhaseOf(this.block(), this.now()));
  protected readonly band = computed(() => fullnessBandOf(this.occupancy()));

  /**
   * `null` once the block is over, and so is the meter: a finished block holds no seats — that is
   * the whole of "liberar una plaza es una consecuencia" — so its counts are all zero and a bar
   * drawn from them would report an empty room as good news. What happened in it is the roster's
   * answer, one click away.
   */
  protected readonly load = computed(() =>
    this.phase() === 'past' ? null : occupancyLoadOf(this.occupancy()),
  );

  protected readonly key = computed(() => blockKeyOf(this.block()));

  protected readonly capacityLabel = computed(() => BLOCK_PHASE_LABELS[this.phase()]);
}
