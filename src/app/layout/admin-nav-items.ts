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
