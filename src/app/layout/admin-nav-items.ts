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
 * doing nothing when pressed.
 */
/**
 * `exact` would drop the highlight the moment the panel opened a block or moved off today: the
 * schedule carries its space and day in the query string and its block in a further segment, and the
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
  /** A shorter form for the bottom bar's five-way split, where "Gestión de aforo" would wrap. */
  readonly compactLabel?: string;
  readonly link: string | null;
}

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  {
    icon: '@tui.scan-line',
    label: $localize`:@@admin.nav.scanner:Escáner`,
    link: '/admin/scan',
  },
  {
    icon: '@tui.calendar-days',
    label: $localize`:@@admin.nav.blocks:Consulta de bloques`,
    compactLabel: $localize`:@@admin.nav.blocksShort:Bloques`,
    link: '/admin/blocks',
  },
  {
    icon: '@tui.settings',
    label: $localize`:@@admin.nav.settings:Ajustes`,
    link: '/admin/settings',
  },
];
