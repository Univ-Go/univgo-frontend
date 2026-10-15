import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminHeader } from '../admin-header/admin-header';
import { AppTabBar } from '../app-tab-bar/app-tab-bar';

/**
 * Level 1: the shell the panel's views render inside, and the counterpart of MainLayout. It is a
 * second shell rather than a mode of the first because the two answer to different people: this one
 * is a desk tool whose bar also carries a space switcher and a search field, while the student's
 * shell navigates a catalogue.
 *
 * Below desktop, both shells give their destinations to the same thumb-reachable bottom bar —
 * AppTabBar, told which destination set to render — rather than each keeping its own copy of that
 * shape. The bar gets no grid area: a position: fixed element ignores one anyway.
 */
@Component({
  selector: 'app-admin-layout',
  imports: [AdminHeader, AppTabBar, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @use 'breakpoints' as bp;

    :host {
      display: grid;
      grid-template-areas:
        'header'
        'main';
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto 1fr;
      // svh, not dvh: the dynamic unit tracks the mobile URL bar, so the shell would resize on every
      // scroll that shows or hides it.
      min-block-size: 100svh;
      background: var(--tui-background-base);
    }

    app-admin-header {
      grid-area: header;
    }

    main {
      grid-area: main;
      min-inline-size: 0;
      // A content cap like MainLayout's, but as padding rather than a max-width on main: main is the
      // scroll container on desktop, and narrowing it would pull its scrollbar in off the window edge.
      padding: var(--univgo-space-xl)
        calc(
          max(0px, (100% - var(--univgo-content-max-width)) / 2) * var(--univgo-admin-side-room) +
            var(--univgo-layout-gutter)
        );
    }

    .skip-link {
      position: absolute;
      z-index: var(--univgo-layer-floating);
      margin: var(--univgo-space-s);
      padding: var(--univgo-space-s) var(--univgo-space-l);
      border-radius: var(--tui-radius-s);
      background: var(--tui-background-elevation-2);
      color: var(--tui-text-primary);
      font: var(--tui-typography-ui-s);
      transform: translateY(-200%);

      &:focus-visible {
        transform: none;
      }
    }

    @media (width >= bp.$desktop) {
      :host {
        // A hard cap here, not just a floor: the shell itself never scrolls from this breakpoint up.
        // Only main does — the header has no reason to move for a view whose own
        // content runs long, and a page-level scroll was carrying it away.
        block-size: 100svh;
        overflow: hidden;
      }

      main {
        // The one thing that scrolls on desktop. A view taller than the shell no longer stretches
        // the whole grid to fit it — it scrolls inside this box instead.
        overflow-y: auto;
      }
    }

    // Room for the fixed bottom bar AppTabBar becomes below desktop, the same reservation
    // MainLayout makes for it.
    @media (width < bp.$desktop) {
      main {
        padding-block-end: calc(
          var(--univgo-space-xl) + var(--univgo-tab-bar-height) + env(safe-area-inset-bottom)
        );
      }
    }
  `,
  template: `
    <a class="skip-link" href="#content" i18n="@@layout.skipToContent">Saltar al contenido</a>

    <app-admin-header />

    <main id="content">
      <router-outlet />
    </main>

    <app-tab-bar admin />
  `,
})
export class AdminLayout {}
