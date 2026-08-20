import type { SpaceCategory } from '../domain/space';

/**
 * Which icon and which wording stand for a category is presentation, not domain, so the maps live
 * here rather than travelling with the space itself. Shared by every view that renders a category —
 * the catalogue's shelves and filter, the reservation card and the reservation detail — instead of
 * being copied per view.
 */
const CATEGORY_ICONS: Readonly<Record<SpaceCategory, string>> = {
  sports: '@tui.volleyball',
  study: '@tui.book-open',
  lab: '@tui.flask-conical',
};

/** Names a collection of spaces, which is how the catalogue reads: a shelf, not a single room. */
const CATEGORY_NAMES: Readonly<Record<SpaceCategory, string>> = {
  sports: $localize`:@@spaces.category.sports:Espacios deportivos`,
  study: $localize`:@@spaces.category.study:Salas de estudio`,
  lab: $localize`:@@spaces.category.lab:Laboratorios`,
};

/**
 * Static instructions per category — this is UI copy, not per-booking data, so it goes through
 * i18n like any other visible text. Read both before booking a space (the booking view) and after
 * (the reservation detail), which is why it lives beside the icon and the name rather than with
 * either feature.
 */
const CATEGORY_RULES: Readonly<Record<SpaceCategory, readonly string[]>> = {
  sports: [
    $localize`:@@reservations.rules.sports.gear:Usa calzado deportivo adecuado para la superficie de la cancha.`,
    $localize`:@@reservations.rules.sports.capacity:Máximo 10 personas por reserva.`,
    $localize`:@@reservations.rules.sports.late:Si llegas con más de 10 minutos de retraso, la reserva se libera.`,
  ],
  study: [
    $localize`:@@reservations.rules.study.volume:Mantén un volumen bajo para no interrumpir a otros grupos.`,
    $localize`:@@reservations.rules.study.food:No se permite comida ni bebida dentro de la sala.`,
    $localize`:@@reservations.rules.study.tidy:Deja el mobiliario en su posición original al terminar.`,
  ],
  lab: [
    $localize`:@@reservations.rules.lab.protection:Usa bata y gafas de protección durante toda la sesión.`,
    $localize`:@@reservations.rules.lab.supervision:No manipules equipos sin la supervisión indicada.`,
    $localize`:@@reservations.rules.lab.incident:Reporta cualquier incidente al encargado del laboratorio de inmediato.`,
  ],
};

export function spaceCategoryIcon(category: SpaceCategory): string {
  return CATEGORY_ICONS[category];
}

export function spaceCategoryName(category: SpaceCategory): string {
  return CATEGORY_NAMES[category];
}

export function spaceCategoryRules(category: SpaceCategory): readonly string[] {
  return CATEGORY_RULES[category];
}
