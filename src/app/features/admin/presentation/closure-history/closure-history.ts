import { DatePipe, formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  LOCALE_ID,
} from '@angular/core';
import { TUI_BREAKPOINT } from '@taiga-ui/core';
import { TuiPagination } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { TuiTable } from '@taiga-ui/addon-table';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import type { SpaceClosure } from '../../domain/space-closure';
import { closureStatusOf, listClosures } from '../../domain/space-closure-catalog';
import { closureReasonName } from '../closure-reason';
import { ClosureStatusBadge } from '../closure-status-badge/closure-status-badge';
import { weekdayListName } from '../closure-weekday';

const CLOSURES_PER_PAGE = 5;

/**
 * Level 3: what has already happened to the selected space, and what is scheduled to. Same
 * table-on-desktop, cards-on-phone shape as `AttendeeRoster` for the same reason: five columns do
 * not fit a phone, and the phone still gets the whole list rather than a trimmed one.
 *
 * Ordering and status are the domain's (`listClosures`, `closureStatusOf`); this component only
 * paginates and lays the rows out.
 */
@Component({
  selector: 'app-closure-history',
  imports: [
    ClosureStatusBadge,
    DatePipe,
    EmptyState,
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

  private readonly breakpoint = inject(TUI_BREAKPOINT);
  private readonly locale = inject(LOCALE_ID);
  private readonly now = new Date();

  protected readonly reasonName = closureReasonName;
  protected readonly compact = computed(() => this.breakpoint() === 'mobile');

  protected readonly listed = computed(() => listClosures(this.closures()));

  protected readonly pageIndex = linkedSignal({
    source: this.listed,
    computation: () => 0,
  });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.listed().length / CLOSURES_PER_PAGE)),
  );

  protected readonly pagedClosures = computed(() => {
    const start = Math.min(this.pageIndex(), this.pageCount() - 1) * CLOSURES_PER_PAGE;

    return this.listed().slice(start, start + CLOSURES_PER_PAGE);
  });

  protected statusOf(closure: SpaceClosure): ReturnType<typeof closureStatusOf> {
    return closureStatusOf(closure, this.now);
  }

  /** "Martes, Jueves, 18:00 – 20:00 · hasta 27 oct 2026", or without the "hasta" clause for a
   *  standing arrangement — one string so the card and table layouts render identical copy. */
  protected recurrenceSummary(closure: SpaceClosure): string {
    const recurrence = closure.recurrence;

    if (recurrence === null) {
      return '';
    }

    const days = weekdayListName(recurrence.weekdays, this.locale);
    const start = formatDate(recurrence.startTime, 'shortTime', this.locale);
    const end = formatDate(recurrence.endTime, 'shortTime', this.locale);
    const range = $localize`:@@admin.closure.history.recurring.range:${days}:DAYS:, ${start}:START: – ${end}:END:`;

    if (recurrence.until === null) {
      return range;
    }

    const until = formatDate(recurrence.until, 'longDate', this.locale);

    return `${range} · ${$localize`:@@admin.closure.history.recurring.until:hasta ${until}:UNTIL:`}`;
  }
}
