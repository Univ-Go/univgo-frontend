import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { APP_CONFIG } from '../../core/config/app-config';
import { BrandLogo } from '../../shared/brand-logo/brand-logo';

/**
 * A destination of the panel. `link` is `null` while the view has not shipped: a `routerLink`
 * pointing at a route that does not exist fails the whole navigation, and the item is disabled
 * rather than silently doing nothing when it is pressed.
 */
interface AsideItem {
  readonly icon: string;
  readonly label: string;
  readonly link: string | null;
}

const ITEMS: readonly AsideItem[] = [
  {
    icon: '@tui.scan-line',
    label: $localize`:@@admin.nav.scanner:Escáner`,
    link: null,
  },
  {
    icon: '@tui.users',
    label: $localize`:@@admin.nav.capacity:Gestión de aforo`,
    link: '/admin/capacity',
  },
  {
    icon: '@tui.calendar-days',
    label: $localize`:@@admin.nav.calendar:Calendario`,
    link: null,
  },
  {
    icon: '@tui.settings',
    label: $localize`:@@admin.nav.settings:Ajustes`,
    link: null,
  },
];

/**
 * Level 1: the panel's destinations.
 *
 * Not built on `tuiNavigationAside` for the same reason the application bar is not built on
 * `tuiNavigationHeader`: that component is `position: fixed`, paints itself in `--tui-theme-color`
 * and expects `tuiNavigationMain`'s twelve-column frame around the content, which is the dark frame
 * and the rounded corners this product already decided against. The landmark is plain semantic
 * markup; every control inside it is still a Taiga component.
 *
 * It is a column beside the content on a desktop and a scrolling row above it on anything narrower,
 * where a fixed sidebar would eat the width the roster needs. The labels stay visible in both: an
 * icon rail would leave every destination without an accessible name unless each one repeated its
 * own label in an attribute.
 */
@Component({
  selector: 'app-admin-aside',
  imports: [BrandLogo, RouterLink, RouterLinkActive, TuiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @use 'breakpoints' as bp;

    :host {
      display: flex;
      flex-direction: column;
      gap: var(--univgo-space-xl);
      padding: var(--univgo-space-l);
      border-inline-end: 1px solid var(--tui-border-normal);
      background: var(--tui-background-elevation-1);
    }

    .brand {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--univgo-space-s);
      padding-block: var(--univgo-space-l);
      text-align: center;
    }

    .brand__name {
      font: var(--tui-typography-heading-h6);
    }

    .brand__role {
      margin: 0;
      color: var(--tui-text-tertiary);
      font: var(--tui-typography-ui-xs);
    }

    .nav {
      display: flex;
      flex-direction: column;
      gap: var(--univgo-space-xs);
    }

    // The item is a Taiga button; what the panel adds is that a row of them reads as a list of
    // places rather than as a row of actions.
    .nav__item {
      justify-content: start;
      inline-size: 100%;
    }

    @media (width < bp.$desktop) {
      :host {
        flex-direction: row;
        align-items: center;
        gap: var(--univgo-space-l);
        padding: var(--univgo-space-s) var(--univgo-layout-gutter);
        border-inline-end: none;
        border-block-end: 1px solid var(--tui-border-normal);
      }

      // The mark is in the bar at these widths, and one wordmark on screen is enough.
      .brand {
        display: none;
      }

      .nav {
        flex-direction: row;
        overflow-x: auto;
        gap: var(--univgo-space-s);
        // Room for the focus ring, which the scroll container would otherwise clip.
        padding: var(--univgo-space-xs);
      }

      .nav__item {
        inline-size: auto;
        flex: none;
      }
    }
  `,
  template: `
    <div class="brand">
      <app-brand-logo />

      <span class="brand__name">{{ organizationName }}</span>
      <p class="brand__role" i18n="@@admin.brandRole">Gestión institucional</p>
    </div>

    <nav class="nav" i18n-aria-label="@@admin.nav.label" aria-label="Secciones del panel">
      @for (item of items; track item.label) {
        @if (item.link; as link) {
          <!-- The destination the panel is on is filled rather than flat, and carries aria-current
               as well: the fill on its own is colour doing the talking. -->
          <a
            tuiButton
            size="m"
            class="nav__item"
            [appearance]="active.isActive ? 'primary' : 'flat'"
            [iconStart]="item.icon"
            [routerLink]="link"
            routerLinkActive
            [routerLinkActiveOptions]="{ exact: true }"
            [attr.aria-current]="active.isActive ? 'page' : null"
            #active="routerLinkActive"
          >
            {{ item.label }}
          </a>
        } @else {
          <button
            tuiButton
            type="button"
            size="m"
            appearance="flat"
            class="nav__item"
            disabled
            [iconStart]="item.icon"
          >
            {{ item.label }}
          </button>
        }
      }
    </nav>
  `,
})
export class AdminAside {
  protected readonly organizationName = inject(APP_CONFIG).organizationName;
  protected readonly items = ITEMS;
}
