import type { CheckboxFilterOption } from '../../../shared/checkbox-filter/checkbox-filter';
import type { SpaceCategory } from '../../spaces/domain/space';
import { SPACE_CATEGORIES } from '../../spaces/domain/space';
import type { ReservationState } from '../domain/reservation';
import { RESERVATION_STATES } from '../domain/reservation';

/**
 * How the list's filters read. The wording is plural where a card's badge is singular — "Reservadas"
 * names a group of bookings, "Reservada" names one — so these are their own keys rather than the
 * badge's reused out of place.
 *
 * Both maps are `Record`s over the domain's own unions, so a state or a category added there
 * breaks the build here until it has a label, instead of quietly never reaching the filter.
 */
const STATE_LABELS: Readonly<Record<ReservationState, string>> = {
  reserved: $localize`:@@reservations.filters.state.reserved:Reservadas`,
  suspended: $localize`:@@reservations.filters.state.suspended:Suspendidas`,
  inProgress: $localize`:@@reservations.filters.state.inProgress:En curso`,
  finished: $localize`:@@reservations.filters.state.finished:Finalizadas`,
  expired: $localize`:@@reservations.filters.state.expired:Expiradas`,
  cancelled: $localize`:@@reservations.filters.state.cancelled:Canceladas`,
};

const CATEGORY_LABELS: Readonly<Record<SpaceCategory, string>> = {
  sports: $localize`:@@reservations.filters.category.sports:Deportes`,
  study: $localize`:@@reservations.filters.category.study:Estudio`,
  lab: $localize`:@@reservations.filters.category.lab:Laboratorios`,
};

export const RESERVATION_STATE_OPTIONS: readonly CheckboxFilterOption<ReservationState>[] =
  RESERVATION_STATES.map((value) => ({ value, label: STATE_LABELS[value] }));

export const RESERVATION_CATEGORY_OPTIONS: readonly CheckboxFilterOption<SpaceCategory>[] =
  SPACE_CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] }));
