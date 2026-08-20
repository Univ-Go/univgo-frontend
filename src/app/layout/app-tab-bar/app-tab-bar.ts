import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { IsActiveMatchOptions } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TuiButton, TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { AccountMenu } from '../account-menu/account-menu';

/**
 * Level 1: the phone's navigation. A bar pinned to the bottom puts every destination inside the
 * thumb's reach, which the top bar never was, and it is where a fifth destination would go without
 * redesigning anything — the bar grows a column.
 *
 * Not a Taiga component: the library ships tabs for switching content inside a view
 * (`tuiTabs`, `tui-segmented`), not a bottom navigation bar, so this is built from Taiga's own
 * button, icon and dropdown primitives rather than replacing them.
 *
 * The raised button in the middle is the one action a person repeats every day. It sits at the
 * centre because that is the easiest point to reach with either hand, and it is a link rather than
 * a button so it behaves like every other destination — long press, open in a new tab, the lot.
 */
@Component({
  selector: 'app-tab-bar',
  imports: [AccountMenu, RouterLink, RouterLinkActive, TuiButton, TuiDropdown, TuiIcon],
  templateUrl: './app-tab-bar.html',
  styleUrl: './app-tab-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppTabBar {
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
}
