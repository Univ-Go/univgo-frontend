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
import { TUI_BREAKPOINT, TuiAppearance, TuiButton } from '@taiga-ui/core';
import { TuiPagination } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { CheckboxFilter } from '../../../../shared/checkbox-filter/checkbox-filter';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import type { Attendee, CheckInStatus } from '../../domain/attendance';
import { CHECK_IN_STATUSES } from '../../domain/attendance';
import { listAttendees } from '../../domain/attendance-roster';
import { CHECK_IN_STATUS_OPTIONS } from '../attendee-filters';
import { AttendeeIdentity } from '../attendee-identity/attendee-identity';
import { AttendeeStatusBadge } from '../attendee-status-badge/attendee-status-badge';

const ATTENDEES_PER_PAGE = 8;

/**
 * What the administrator can do to one row. Only one state leaves anything to do: a reservation
 * waiting to be scanned can be checked in. `docs/booking-flow.md` §10 rules out cancelling a
 * reservation that is already `in_progress` ("no se puede: ya se está usando"), and the doc has no
 * per-student cancel action at all — §11's "cancelar reservas del espacio" is a space-wide control
 * for maintenance and closures, not a row in this table. Every other state has no action.
 */
interface RowAction {
  readonly icon: string;
  readonly appearance: string;
  readonly label: string;
}

const CHECK_IN_ACTION: RowAction = {
  icon: '@tui.user-check',
  appearance: 'accent',
  label: $localize`:@@admin.roster.action.checkIn:Registrar entrada`,
};

const ROW_ACTIONS: Readonly<Record<CheckInStatus, RowAction | null>> = {
  reserved: CHECK_IN_ACTION,
  in_progress: null,
  completed: null,
  expired: null,
  cancelled: null,
};

/**
 * Level 3: the block's list of students. It renders as a table where there is room for one and as
 * stacked cards where there is not, from the same rows and the same two child components, so the
 * phone gets the whole list rather than a trimmed one.
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
    TuiButton,
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

  protected readonly statusOptions = CHECK_IN_STATUS_OPTIONS;
  protected readonly statusLabel = $localize`:@@admin.roster.filters.status.label:Estado`;

  protected readonly compact = computed(() => this.breakpoint() === 'mobile');

  protected readonly selectedStatuses = signal<ReadonlySet<CheckInStatus>>(
    new Set(CHECK_IN_STATUSES),
  );

  protected readonly listed = computed(() =>
    listAttendees(this.attendees(), {
      query: this.query(),
      statuses: this.selectedStatuses(),
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

  protected actionFor(attendee: Attendee): RowAction | null {
    return ROW_ACTIONS[attendee.status];
  }

  protected toggleStatus(status: CheckInStatus, checked: boolean): void {
    this.selectedStatuses.update((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(status);
      } else {
        next.delete(status);
      }

      return next;
    });
  }
}
