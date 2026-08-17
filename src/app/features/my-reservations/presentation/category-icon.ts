import type { SpaceCategory } from '../domain/reservation';

/**
 * Which icon stands for a category is presentation, not domain, so the map lives here instead of
 * travelling with the reservation itself. Shared by every view that renders a category mark
 * (reservation card, reservation detail) instead of being copied per view.
 */
const CATEGORY_ICONS: Readonly<Record<SpaceCategory, string>> = {
  sports: '@tui.volleyball',
  study: '@tui.book-open',
  lab: '@tui.flask-conical',
};

export function categoryIcon(category: SpaceCategory): string {
  return CATEGORY_ICONS[category];
}
