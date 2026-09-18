import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { TuiTable } from '@taiga-ui/addon-table';
import { TUI_BREAKPOINT, TuiAppearance } from '@taiga-ui/core';
import { TuiPagination } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { CheckboxFilter } from '../../../../shared/checkbox-filter/checkbox-filter';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import type { Attendee, RosterState } from '../../domain/attendance';
import { ROSTER_STATES } from '../../domain/attendance';
import { listAttendees } from '../../domain/attendance-roster';
import { ROSTER_STATE_OPTIONS } from '../attendee-filters';
import { AttendeeIdentity } from '../attendee-identity/attendee-identity';
import { AttendeeStatusBadge } from '../attendee-status-badge/attendee-status-badge';

const ATTENDEES_PER_PAGE = 8;

/**
 * Level 3: the block's list of students. It renders as a table where there is room for one and as
 * stacked cards where there is not, from the same rows and the same two child components, so the
 * phone gets the whole list rather than a trimmed one.
 *
 * Reading is all a row offers. Checking somebody in happens at the scanner and nowhere else: the
 * server takes a code to check in, and a list of names carries none — a button here could only ever
 * be one that does not work.
 *
 * The search text arrives from the view — it is typed in the panel's bar, which is a different
 * component in a different layer — while which statuses are listed and which page is showing are
 * this component's own: they are the shape of one glance at the list, not an address. Which
 * attendees answer the question is neither, and stays in the domain.
 */
@Component({
  selector: 'app-attendee-roster',
  imports: [
    AttendeeIdentity,
    AttendeeStatusBadge,
    CheckboxFilter,
    DatePipe,
    EmptyState,
    TuiAppearance,
    TuiCardLarge,
    TuiPagination,
    TuiSurface,
    TuiTable,
  ],
  templateUrl: './attendee-roster.html',
  styleUrl: './attendee-roster.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendeeRoster {
  public readonly attendees = input.required<readonly Attendee[]>();
  /** Free text typed in the panel's bar, which searches the roster of whatever block is open. */
  public readonly query = input<string | null>(null);

  private readonly breakpoint = inject(TUI_BREAKPOINT);

  protected readonly statusOptions = ROSTER_STATE_OPTIONS;
  protected readonly statusLabel = $localize`:@@admin.roster.filters.status.label:Estado`;

  protected readonly compact = computed(() => this.breakpoint() === 'mobile');

  protected readonly selectedStates = signal<ReadonlySet<RosterState>>(new Set(ROSTER_STATES));

  protected readonly listed = computed(() =>
    listAttendees(this.attendees(), {
      query: this.query(),
      states: this.selectedStates(),
    }),
  );

  /** Answering a narrower question from page four would hide results nobody asked to skip. */
  protected readonly pageIndex = linkedSignal({
    source: this.listed,
    computation: () => 0,
  });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.listed().length / ATTENDEES_PER_PAGE)),
  );

  protected readonly pagedAttendees = computed(() => {
    const start = Math.min(this.pageIndex(), this.pageCount() - 1) * ATTENDEES_PER_PAGE;

    return this.listed().slice(start, start + ATTENDEES_PER_PAGE);
  });

  protected toggleState(state: RosterState, checked: boolean): void {
    this.selectedStates.update((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(state);
      } else {
        next.delete(state);
      }

      return next;
    });
  }
}
