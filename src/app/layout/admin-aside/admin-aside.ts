import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { APP_CONFIG } from '../../core/config/app-config';
import { BrandLogo } from '../../shared/brand/brand-logo';
import { ADMIN_NAV_ITEMS } from '../admin-nav-items';

/**
 * Level 1: the panel's destinations, as a column.
 *
 * Not built on `tuiNavigationAside` for the same reason the application bar is not built on
 * `tuiNavigationHeader`: that component is `position: fixed`, paints itself in `--tui-theme-color`
 * and expects `tuiNavigationMain`'s twelve-column frame around the content, which is the dark frame
 * and the rounded corners this product already decided against. The landmark is plain semantic
 * markup; every control inside it is still a Taiga component.
 *
 * Desktop and up only: below that, `AppTabBar` renders these same destinations (`ADMIN_NAV_ITEMS`) as
 * its own admin variant, the fixed bottom bar the student shell already has — at the same breakpoint
 * that bar already hides itself at, so the two hand off without a gap where neither is visible. A
 * column and a bottom bar are different enough shapes — pill buttons with visible labels versus an
 * icon-over-label cell five across a phone's width — that reusing one component's markup for both
 * fights it more than it saves; sharing the destination data instead is what keeps the two from
 * drifting apart.
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

    // AppTabBar takes over below desktop, the same pixel it hides itself above; the column has
    // nothing left to do at that width.
    @media (width < bp.$desktop) {
      :host {
        display: none;
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
  protected readonly items = ADMIN_NAV_ITEMS;
}
