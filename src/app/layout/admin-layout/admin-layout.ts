import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminAside } from '../admin-aside/admin-aside';
import { AdminHeader } from '../admin-header/admin-header';

/**
 * Level 1: the shell the panel's views render inside, and the counterpart of `MainLayout`. It is a
 * second shell rather than a mode of the first because the two answer to different people: the
 * student's shell navigates a catalogue and floats a tab bar within reach of a thumb, while this one
 * is a desk tool whose destinations sit in a column and whose bar is a search field.
 *
 * The three landmarks are laid out by named areas rather than by nesting, which is what lets the
 * same markup put the aside beside the content on a desktop and above it — under the bar, where the
 * search stays the first thing on screen — on anything narrower. A fixed sidebar at those widths
 * would take the room the roster needs to stay readable.
 */
@Component({
  selector: 'app-admin-layout',
  imports: [AdminAside, AdminHeader, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @use 'breakpoints' as bp;

    :host {
      display: grid;
      grid-template-areas:
        'aside header'
        'aside main';
      grid-template-columns: 16rem minmax(0, 1fr);
      grid-template-rows: auto 1fr;
      // svh, not dvh: the dynamic unit tracks the mobile URL bar, so the shell would resize on every
      // scroll that shows or hides it.
      min-block-size: 100svh;
      background: var(--tui-background-base);
    }

    app-admin-aside {
      grid-area: aside;
      // The column keeps its place while the roster beside it scrolls, and scrolls on its own once
      // there are more destinations than fit.
      position: sticky;
      inset-block-start: 0;
      block-size: 100svh;
      overflow-y: auto;
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

    @media (width < bp.$desktop) {
      :host {
        grid-template-areas:
          'header'
          'aside'
          'main';
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: auto auto 1fr;
      }

      app-admin-aside {
        position: static;
        block-size: auto;
        overflow-y: visible;
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
  `,
})
export class AdminLayout {}
