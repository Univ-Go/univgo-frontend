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
import { closureReasonName } from '../../../spaces/presentation/closure-reason';
import { BLOCK_PHASE_LABELS } from '../block-phase-copy';
import { BlockStatusBadge } from '../block-status-badge/block-status-badge';

/**
 * Level 3: one block of the day's schedule, as a card in the shift grid it sits in.
 *
 * What it shows changes with the clock, and that is the point of the view rather than a flourish: a
 * block still to come reports what has been booked, one in progress reports who is in the room and
 * who has yet to walk in, and one that is over still draws the same meter from the same
 * `occupied`/`free` pair — the heading above it relabels to "Asistencia" because that is what the
 * number means once the block ends, even though the true attendance count (who actually checked in)
 * lives in the roster, one click away, not in this list's own fields.
 *
 * The whole card is deliberately not a link. It carries a button, and a link wrapping a button is
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
   * `null` only while the space is shut, the one case with no seats to read at all. A finished
   * block still draws the bar from the same `occupied`/`free` the server gave it — reservations
   * stop holding a seat once they finish ("liberar una plaza es una consecuencia", CLAUDE.md §22),
   * so most of the time it reads as empty. The true attendance count is the roster's answer, one
   * click away, not something this card recomputes.
   */
  protected readonly load = computed(() =>
    this.block().closed ? null : occupancyLoadOf(this.occupancy()),
  );

  protected readonly key = computed(() => blockKeyOf(this.block()));

  protected readonly capacityLabel = computed(() => BLOCK_PHASE_LABELS[this.phase()]);

  /** A shut block reports why instead of an aforo nobody can use: a block shown as available
   *  invites counting on places that do not exist. */
  protected readonly closureReason = computed(() => closureReasonName(this.block().closureReason));
}
