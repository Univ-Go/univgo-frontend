import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { TuiTable } from '@taiga-ui/addon-table';
import { TUI_BREAKPOINT, TuiButton } from '@taiga-ui/core';
import { TuiPagination } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import type { SpaceClosure } from '../../domain/space-closure';
import { closureStatusOf, isRevertible } from '../../domain/space-closure';
import { closureReasonName } from '../closure-reason';
import { ClosureStatusBadge } from '../closure-status-badge/closure-status-badge';

const CLOSURES_PER_PAGE = 5;

/**
 * Level 3: what has already happened to the selected space, what is scheduled to, and the way back
 * from any of it. Same table-on-desktop, cards-on-phone shape as `AttendeeRoster` for the same
 * reason: four columns do not fit a phone, and the phone still gets the whole list.
 *
 * Reverting is emitted rather than performed here: the page owns the list this row belongs to, and
 * a row that reopened a space on its own would leave that list showing something else.
 *
 * The order is the server's — most recent first — and the status is the domain's.
 */
@Component({
  selector: 'app-closure-history',
  imports: [
    ClosureStatusBadge,
    DatePipe,
    EmptyState,
    TuiButton,
    TuiCardLarge,
    TuiPagination,
    TuiSurface,
    TuiTable,
  ],
  templateUrl: './closure-history.html',
  styleUrl: './closure-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClosureHistory {
  public readonly closures = input.required<readonly SpaceClosure[]>();
  /** The closure whose revert is in flight, so only its own row reports the wait. */
  public readonly reverting = input<string | null>(null);

  public readonly reverted = output<SpaceClosure>();

  private readonly breakpoint = inject(TUI_BREAKPOINT);
  private readonly now = new Date();

  protected readonly reasonName = closureReasonName;
  protected readonly revertible = isRevertible;
  protected readonly compact = computed(() => this.breakpoint() === 'mobile');

  protected readonly pageIndex = linkedSignal({
    source: this.closures,
    computation: () => 0,
  });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.closures().length / CLOSURES_PER_PAGE)),
  );

  protected readonly pagedClosures = computed(() => {
    const start = Math.min(this.pageIndex(), this.pageCount() - 1) * CLOSURES_PER_PAGE;

    return this.closures().slice(start, start + CLOSURES_PER_PAGE);
  });

  protected statusOf(closure: SpaceClosure): ReturnType<typeof closureStatusOf> {
    return closureStatusOf(closure, this.now);
  }
}
