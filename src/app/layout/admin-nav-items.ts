import type { IsActiveMatchOptions } from '@angular/router';

/**
 * The administrator's destinations, shared by the desktop sidebar (`AdminAside`) and the compact
 * bottom bar (`AppTabBar`'s admin variant) so the two surfaces cannot drift into different sets.
 * A plain data module, with no Angular decorators: importing it from `AppTabBar` — part of the
 * student shell's own, eagerly-reached bundle — does not pull `AdminAside`'s component code along
 * with it.
 *
 * `link` is `null` while the destination has not shipped: a `routerLink` pointing at a route that
 * does not exist fails the whole navigation, and the item renders disabled instead of silently
 * doing nothing when pressed. It is also `null` on `/admin/spaces`, before any space is open — a
 * destination that only exists relative to a space is exactly as unshippable as one that doesn't
 * exist yet.
 *
 * The value itself is a suffix (`'scan'`), not a full path: every destination now lives under the
 * current space (`/admin/:spaceId/scan`), so the caller composes `['/admin', spaceId, link]` rather
 * than binding it straight to `routerLink`.
 */
/**
 * `exact` would drop the highlight the moment the panel opened a block or moved off today: the
 * schedule carries its space and block in the path and its day in the query string, and the
 * shorthand demands an exact match on all three. Subset paths keep the section marked while the
 * administrator is anywhere inside it, which is what the sidebar is answering.
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
  /** A shorter form for the bottom bar's narrow columns, where "Consulta de bloques" would wrap. */
  readonly compactLabel?: string;
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
    label: $localize`:@@admin.nav.blocks:Consulta de bloques`,
    compactLabel: $localize`:@@admin.nav.blocksShort:Bloques`,
    link: 'blocks',
  },
  {
    icon: '@tui.settings',
    label: $localize`:@@admin.nav.settings:Ajustes`,
    link: 'settings',
  },
];
