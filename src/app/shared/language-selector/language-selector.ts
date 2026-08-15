import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TuiSegmented } from '@taiga-ui/kit';
import { filter, map } from 'rxjs';
import { APP_LOCALES } from '../../core/i18n/locales';

/**
 * Level 1: reachable from every view, like the theme switch.
 *
 * `@angular/localize` replaces messages at build time, so each locale is a separate application
 * served under its own base href. Switching language is therefore a document navigation to the
 * twin build — not a runtime toggle — and the current route is carried across so the user lands on
 * the same page. A single-locale dev server has no sibling build to navigate to.
 */
@Component({
  selector: 'app-language-selector',
  imports: [TuiSegmented],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tui-segmented
      size="s"
      role="group"
      i18n-aria-label="@@i18n.languageSelector"
      aria-label="Idioma"
      [activeItemIndex]="activeIndex"
    >
      @for (locale of options(); track locale.code) {
        <a
          [attr.aria-current]="locale.active ? 'true' : null"
          [attr.lang]="locale.code"
          [href]="locale.href"
          >{{ locale.label }}</a
        >
      }
    </tui-segmented>
  `,
})
export class LanguageSelector {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  /** Angular rewrites `<base href>` per locale, which makes it the reliable source. */
  private readonly baseHref = new URL(this.document.baseURI).pathname;

  private readonly route = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  private readonly current =
    APP_LOCALES.find((locale) => this.baseHref === `/${locale.code}/`)?.code ?? APP_LOCALES[0].code;

  protected readonly activeIndex = Math.max(
    APP_LOCALES.findIndex((locale) => locale.code === this.current),
    0,
  );

  protected readonly options = computed(() =>
    APP_LOCALES.map((locale) => ({
      ...locale,
      active: locale.code === this.current,
      href: `/${locale.code}${this.route()}`,
    })),
  );
}
