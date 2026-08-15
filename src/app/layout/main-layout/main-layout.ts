import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppFooter } from '../app-footer/app-footer';
import { AppHeader } from '../app-header/app-header';

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
  imports: [RouterOutlet, AppFooter, AppHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
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

    .skip-link {
      position: absolute;
      z-index: 2;
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
  `,
})
export class MainLayout {}
