import type { CheckboxFilterOption } from '../../../shared/checkbox-filter/checkbox-filter';
import type { RosterState } from '../domain/attendance';
import { ROSTER_STATES } from '../domain/attendance';

/**
 * How the roster's status filter reads. Plural where a row's badge is singular — "Pendientes" names
 * a group of reservations, "Pendiente" names one — so these are their own keys rather than the
 * badge's reused out of place.
 *
 * A `Record` over the states a roster can hold, so one added there breaks the build here until it
 * has a label instead of quietly never reaching the filter. A cancelled booking is not among them:
 * the server does not list it, because it stopped belonging to the block when it was given up.
 */
const STATE_LABELS: Readonly<Record<RosterState, string>> = {
  reserved: $localize`:@@admin.roster.filters.status.reserved:Pendientes`,
  inProgress: $localize`:@@admin.roster.filters.status.inProgress:En sala`,
  finished: $localize`:@@admin.roster.filters.status.completed:Finalizadas`,
  expired: $localize`:@@admin.roster.filters.status.expired:Expiradas`,
};

export const ROSTER_STATE_OPTIONS: readonly CheckboxFilterOption<RosterState>[] = ROSTER_STATES.map(
  (value) => ({ value, label: STATE_LABELS[value] }),
);
