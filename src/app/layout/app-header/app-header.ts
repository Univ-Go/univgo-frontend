import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { IsActiveMatchOptions } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TUI_BREAKPOINT, TuiButton, TuiDropdown, TuiLink } from '@taiga-ui/core';
import { TuiAvatar, TuiBadgedContent, TuiBadgeNotification } from '@taiga-ui/kit';
import { MOCK_SESSION_USER } from '../../features/auth/infrastructure/mock-session';
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
 */
@Component({
  selector: 'app-header',
  imports: [
    AccountMenu,
    RouterLink,
    RouterLinkActive,
    TuiAvatar,
    TuiBadgeNotification,
    TuiBadgedContent,
    TuiButton,
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
  private readonly breakpoint = inject(TUI_BREAKPOINT);

  private readonly userName = MOCK_SESSION_USER.name;

  /**
   * On a phone the navigation, the utilities and the account belong to the tab bar, which puts them
   * within reach of the thumb; the top bar keeps only the brand and the notifications. Rendering
   * each control in exactly one place keeps them out of the accessibility tree twice.
   */
  protected readonly compact = computed(() => this.breakpoint() === 'mobile');

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

  protected readonly initials = this.userName.slice(0, 1);
}
