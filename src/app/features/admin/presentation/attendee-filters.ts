import type { CheckboxFilterOption } from '../../../shared/checkbox-filter/checkbox-filter';
import type { CheckInStatus } from '../domain/attendance';
import { CHECK_IN_STATUSES } from '../domain/attendance';

/**
 * How the roster's status filter reads. Plural where a row's badge is singular — "Pendientes" names
 * a group of reservations, "Pendiente" names one — so these are their own keys rather than the
 * badge's reused out of place.
 *
 * A `Record` over the domain's own union, so a state added there breaks the build here until it has
 * a label instead of quietly never reaching the filter.
 */
const STATUS_LABELS: Readonly<Record<CheckInStatus, string>> = {
  in_progress: $localize`:@@admin.roster.filters.status.inProgress:En sala`,
  reserved: $localize`:@@admin.roster.filters.status.reserved:Pendientes`,
  completed: $localize`:@@admin.roster.filters.status.completed:Finalizadas`,
  expired: $localize`:@@admin.roster.filters.status.expired:Expiradas`,
  cancelled: $localize`:@@admin.roster.filters.status.cancelled:Canceladas`,
};

export const CHECK_IN_STATUS_OPTIONS: readonly CheckboxFilterOption<CheckInStatus>[] =
  CHECK_IN_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));
