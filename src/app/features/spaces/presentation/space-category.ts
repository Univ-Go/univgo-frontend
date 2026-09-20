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

export function spaceCategoryIcon(category: SpaceCategory): string {
  return CATEGORY_ICONS[category];
}

export function spaceCategoryName(category: SpaceCategory): string {
  return CATEGORY_NAMES[category];
}
