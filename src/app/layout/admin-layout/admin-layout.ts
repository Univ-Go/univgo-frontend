import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminAside } from '../admin-aside/admin-aside';
import { AdminHeader } from '../admin-header/admin-header';
import { AppTabBar } from '../app-tab-bar/app-tab-bar';

/**
 * Level 1: the shell the panel's views render inside, and the counterpart of MainLayout. It is a
 * second shell rather than a mode of the first because the two answer to different people: this one
 * is a desk tool whose destinations sit in a column and whose bar is a search field, while the
 * student's shell navigates a catalogue.
 *
 * Below desktop, both shells give their destinations to the same thumb-reachable bottom bar —
 * AppTabBar, told which destination set to render — rather than each keeping its own copy of that
 * shape. The three landmarks are laid out by named areas rather than by nesting, which is what lets
 * the same markup put the aside beside the content from desktop up and give the bar no grid area at
 * all: a position: fixed element ignores one anyway, and leaving the track would book room next to
 * a main that no longer has a sibling there.
 */
@Component({
  selector: 'app-admin-layout',
  imports: [AdminAside, AdminHeader, AppTabBar, RouterOutlet],
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
      padding: var(--univgo-space-xl) var(--univgo-layout-gutter);
    }

    .skip-link {
      position: absolute;
      z-index: 3;
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
        grid-template-areas:
          'aside header'
          'aside main';
        grid-template-columns: 16rem minmax(0, 1fr);
        // A hard cap here, not just a floor: the shell itself never scrolls from this breakpoint up.
        // Only main does — the column and the header have no reason to move for a view whose own
        // content runs long, and a page-level scroll was carrying them away with it.
        block-size: 100svh;
        overflow: hidden;
      }

      main {
        // The one thing that scrolls on desktop. A view taller than the shell no longer stretches
        // the whole grid to fit it — it scrolls inside this box instead, same as the aside's own
        // nav does below if it ever grows past its column.
        overflow-y: auto;
      }

      app-admin-aside {
        grid-area: aside;
        // 100% of a now fixed-height shell, so this always is exactly one screen tall — no
        // position: sticky needed to keep it in view, because nothing around it scrolls anymore.
        block-size: 100%;
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

    <app-admin-aside />

    <main id="content">
      <router-outlet />
    </main>

    <app-tab-bar admin />
  `,
})
export class AdminLayout {}
