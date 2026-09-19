import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { IsActiveMatchOptions } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TuiDropdown, TuiLink } from '@taiga-ui/core';
import { TuiAvatar } from '@taiga-ui/kit';
import { SessionStore } from '../../features/auth/application/session-store';
import { BrandIsotype } from '../../shared/brand/brand-isotype';
import { BrandLogo } from '../../shared/brand/brand-logo';
import { LanguageSelector } from '../../shared/language-selector/language-selector';
import { ThemeToggle } from '../../shared/theme-toggle/theme-toggle';
import { AccountMenu } from '../account-menu/account-menu';

/**
 * Level 1: the application bar.
 *
 * Not built on `tuiNavigationHeader`: that component belongs to Taiga's aside-and-header shell — it
 * pins a 3rem height, spans `100vw` and paints a full-page black backdrop through a 100rem shadow,
 * which is what put a dark frame and rounded corners around our content. The bar is plain semantic
 * markup instead, and every control inside it is still a Taiga component.
 *
 * Only routes that exist are links: a `routerLink` to a missing route fails the whole navigation,
 * so a nav item stays a plain button until its view ships.
 *
 * On a phone the destinations move to the tab bar, within reach of the thumb, but the utilities and
 * the account stay here. They used to travel down with them, which left the same control reachable
 * from two surfaces depending on the width; keeping them in one place is also what makes both
 * shells the same shape, since the panel's bottom bar never had an account tab to put them in.
 */
@Component({
  selector: 'app-header',
  imports: [
    AccountMenu,
    BrandIsotype,
    BrandLogo,
    RouterLink,
    RouterLinkActive,
    TuiAvatar,
    TuiDropdown,
    TuiLink,
    LanguageSelector,
    ThemeToggle,
  ],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  private readonly session = inject(SessionStore);

  /**
   * The catalogue carries its filter in the query string, so `exact` alone would drop the highlight
   * the moment a category is picked: the shorthand also demands an exact query-string match.
   */
  protected readonly spacesLinkOptions: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored',
  };

  protected readonly menuOpen = signal(false);

  protected readonly initials = computed(() => this.session.user()?.firstName.slice(0, 1) ?? '');
}
