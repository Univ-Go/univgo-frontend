import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiBadge, TuiProgressBar } from '@taiga-ui/kit';
import type { AdminBlock } from '../../domain/attendance';
import { blockLoadOf } from '../../domain/attendance-roster';
import {
  blockKeyOf,
  blockPhaseOf,
  fullnessBandOf,
  occupancyLoadOf,
} from '../../domain/block-schedule';
import { closureReasonName } from '../../../spaces/presentation/closure-reason';
import { BlockStatusBadge } from '../block-status-badge/block-status-badge';

/**
 * Level 3: one block of the day's schedule, as a card in the shift it sits in. It answers with the
 * same number the week picker does — free spots out of the total — and the same status badge, so a
 * day and its blocks are read the same way.
 *
 * A finished block drops the meter for a pointer to its detail: reservations stop holding a seat
 * once they finish (`CLAUDE.md` §22, invariant 1), so its count would read "all free", and who
 * actually turned up is the roster's answer.
 */
@Component({
  selector: 'app-block-row',
  imports: [BlockStatusBadge, DatePipe, RouterLink, TuiBadge, TuiButton, TuiIcon, TuiProgressBar],
  templateUrl: './block-row.html',
  styleUrl: './block-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockRow {
  public readonly block = input.required<AdminBlock>();
  /** Passed in rather than read here, so the whole list agrees on one instant and stays testable. */
  public readonly now = input.required<Date>();
  /** Carried to the detail's address so returning lands back on this same day. */
  public readonly day = input.required<string>();

  protected readonly occupancy = computed(() => blockLoadOf(this.block()));
  protected readonly phase = computed(() => blockPhaseOf(this.block(), this.now()));
  protected readonly band = computed(() => fullnessBandOf(this.occupancy()));

  protected readonly load = computed(() => occupancyLoadOf(this.occupancy()));

  protected readonly key = computed(() => blockKeyOf(this.block()));

  /** A shut block says why instead of showing seats nobody can use. */
  protected readonly closureReason = computed(() => closureReasonName(this.block().closureReason));
}
