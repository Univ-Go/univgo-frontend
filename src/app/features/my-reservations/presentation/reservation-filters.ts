import type { CheckboxFilterOption } from '../../../shared/checkbox-filter/checkbox-filter';
import type { SpaceCategory } from '../../spaces/domain/space';
import { SPACE_CATEGORIES } from '../../spaces/domain/space';
import type { ReservationStatus } from '../domain/reservation';
import { RESERVATION_STATUSES } from '../domain/reservation';

/**
 * How the list's filters read. The wording is plural where a card's badge is singular — "Próximas"
 * names a group of bookings, "Próxima" names one — so these are their own keys rather than the
 * badge's reused out of place.
 *
 * Both maps are `Record`s over the domain's own unions, so a status or a category added there
 * breaks the build here until it has a label, instead of quietly never reaching the filter.
 */
const STATUS_LABELS: Readonly<Record<ReservationStatus, string>> = {
  upcoming: $localize`:@@reservations.filters.status.upcoming:Próximas`,
  ongoing: $localize`:@@reservations.filters.status.ongoing:Actuales`,
  past: $localize`:@@reservations.filters.status.past:Pasadas`,
};

const CATEGORY_LABELS: Readonly<Record<SpaceCategory, string>> = {
  sports: $localize`:@@reservations.filters.category.sports:Deportes`,
  study: $localize`:@@reservations.filters.category.study:Estudio`,
  lab: $localize`:@@reservations.filters.category.lab:Laboratorios`,
};

export const RESERVATION_STATUS_OPTIONS: readonly CheckboxFilterOption<ReservationStatus>[] =
  RESERVATION_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));

export const RESERVATION_CATEGORY_OPTIONS: readonly CheckboxFilterOption<SpaceCategory>[] =
  SPACE_CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] }));
