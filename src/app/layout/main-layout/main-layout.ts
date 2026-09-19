import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppFooter } from '../app-footer/app-footer';
import { AppHeader } from '../app-header/app-header';
import { AppTabBar } from '../app-tab-bar/app-tab-bar';

/**
 * Level 1: the shell every signed-in view renders inside. Sign-in stays outside it on purpose —
 * a navigation bar is meaningless before there is a session.
 *
 * `main` is plain: `tuiNavigationMain` is a 12-column grid with a 1.5rem transparent border and a
 * width that reserves room for Taiga's collapsible aside. That is what rounded the content's top
 * corners and left the shell's dark frame showing behind them.
 */
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, AppFooter, AppHeader, AppTabBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @use 'breakpoints' as bp;

    :host {
      display: flex;
      flex-direction: column;
      // svh, not dvh: the dynamic unit tracks the mobile URL bar, so the shell resizes on every
      // scroll that shows or hides it and the sticky bar visibly jitters. The small unit is stable.
      min-block-size: 100svh;
    }

    main {
      flex: 1;
      inline-size: 100%;
      max-inline-size: var(--univgo-content-max-width);
      margin-inline: auto;
      padding: var(--univgo-space-xl) var(--univgo-layout-gutter);
    }

    // The tab bar floats over the page through tablet, so the shell leaves it room: without this the
    // footer, and the last thing on every view, end up underneath it. The quick action floats above
    // the bar in the same corner, so the room clears both — otherwise the end of the page finishes
    // under a button.
    @media (width < bp.$desktop) {
      app-footer {
        padding-block-end: calc(
          var(--univgo-tab-bar-height) + var(--univgo-quick-action-size) + var(--univgo-space-l) +
            env(safe-area-inset-bottom)
        );
      }
    }

    // A view that raises a floating bar pins it to the viewport's bottom edge — which is where the
    // footer sits once the page is scrolled to its end, so the bar lands on the legal links and a
    // link under a bar cannot be clicked. The room each view reserves keeps its own last row clear
    // while scrolling past; the end of the page is the shell's to leave, because the footer is.
    //
    // Matched with :has rather than with a flag passed down: which view raised a bar is the view's
    // business, and a shell that had to be told would be one more thing to keep in step.
    :host:has(tui-action-bar) app-footer {
      padding-block-end: var(--univgo-action-bar-room);
    }

    .skip-link {
      position: absolute;
      z-index: var(--univgo-layer-sticky);
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
  `,
  template: `
    <a class="skip-link" href="#content" i18n="@@layout.skipToContent">Saltar al contenido</a>

    <app-header />

    <main id="content">
      <router-outlet />
    </main>

    <app-footer />

    <app-tab-bar />
  `,
})
export class MainLayout {}
