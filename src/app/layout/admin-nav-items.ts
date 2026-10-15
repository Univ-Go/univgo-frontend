import type { IsActiveMatchOptions } from '@angular/router';

/**
 * The administrator's destinations, shared by the desktop bar (`AdminHeader`) and the compact
 * bottom bar (`AppTabBar`'s admin variant) so the two surfaces cannot drift into different sets.
 * A plain data module, with no Angular decorators: importing it from `AppTabBar` — part of the
 * student shell's own, eagerly-reached bundle — does not pull `AdminHeader`'s component code along
 * with it.
 *
 * `link` is `null` while the destination has not shipped: a `routerLink` pointing at a route that
 * does not exist fails the whole navigation, and the item renders disabled instead of silently
 * doing nothing when pressed.
 *
 * On `/admin/spaces`, before any space is open, these items are left out rather than disabled. Three
 * greyed tabs read as something broken to a person who does not already know a space has to be
 * picked first; the list in front of them is the one thing to do there.
 *
 * The value itself is a suffix (`'scan'`), not a full path: every destination now lives under the
 * current space (`/admin/:spaceId/scan`), so the caller composes `['/admin', spaceId, link]` rather
 * than binding it straight to `routerLink`.
 */
/**
 * `exact` would drop the highlight the moment the panel opened a block or moved off today: the
 * schedule carries its space and block in the path and its day in the query string, and the
 * shorthand demands an exact match on all three. Subset paths keep the section marked while the
 * administrator is anywhere inside it, which is what the bar is answering.
 *
 * Safe across the whole set because no destination is a path prefix of another.
 */
export const ADMIN_NAV_MATCH_OPTIONS: IsActiveMatchOptions = {
  paths: 'subset',
  queryParams: 'ignored',
  fragment: 'ignored',
  matrixParams: 'ignored',
};

export interface AdminNavItem {
  readonly icon: string;
  readonly label: string;
  readonly link: string | null;
}

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  {
    icon: '@tui.scan-line',
    label: $localize`:@@admin.nav.scanner:Escáner`,
    link: 'scan',
  },
  {
    icon: '@tui.calendar-days',
    label: $localize`:@@admin.nav.blocks:Ocupación`,
    link: 'blocks',
  },
  {
    icon: '@tui.settings',
    label: $localize`:@@admin.nav.settings:Ajustes`,
    link: 'settings',
  },
];

/**
 * The list every other destination hangs off. Kept apart from `ADMIN_NAV_ITEMS` because it is not
 * relative to a space: it is how a person gets back to choosing one, so it stays in the bar on every
 * admin screen — named, not hidden behind the logo or the last option of the space switcher.
 */
export const ADMIN_SPACES_NAV_ITEM = {
  icon: '@tui.layout-grid',
  label: $localize`:@@admin.nav.spaces:Espacios`,
  link: '/admin/spaces',
} as const;
