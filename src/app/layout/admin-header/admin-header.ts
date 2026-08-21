import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TuiButton, TuiDropdown, TuiInput } from '@taiga-ui/core';
import { TuiAvatar, TuiBadgeNotification, TuiBadgedContent } from '@taiga-ui/kit';
import { map } from 'rxjs';
import { MOCK_SESSION_USER } from '../../features/auth/infrastructure/mock-session';
import { BrandLogo } from '../../shared/brand-logo/brand-logo';
import { LanguageSelector } from '../../shared/language-selector/language-selector';
import { ThemeToggle } from '../../shared/theme-toggle/theme-toggle';
import { AccountMenu } from '../account-menu/account-menu';

/** The query-string key the roster reads its search from. */
const QUERY_PARAM = 'query';

/**
 * Level 1: the panel's bar.
 *
 * The search field is here because that is where an administrator looks for it — one box, above
 * whatever the panel is showing — but what it narrows is the view underneath, which is in another
 * layer entirely. It writes the text to the query string instead of to a store the two would have
 * to share: the URL is the one thing both can read without either importing the other, and it makes
 * a filtered roster something somebody can send to a colleague.
 *
 * Every keystroke replaces the current entry rather than pushing a new one, so Back leaves the
 * panel instead of walking a letter at a time out of a word somebody typed.
 */
@Component({
  selector: 'app-admin-header',
  imports: [
    AccountMenu,
    BrandLogo,
    FormsModule,
    LanguageSelector,
    RouterLink,
    ThemeToggle,
    TuiAvatar,
    TuiBadgeNotification,
    TuiBadgedContent,
    TuiButton,
    TuiDropdown,
    TuiInput,
  ],
  templateUrl: './admin-header.html',
  styleUrl: './admin-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHeader {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly initials = MOCK_SESSION_USER.name.slice(0, 1);

  protected readonly menuOpen = signal(false);

  protected readonly query = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get(QUERY_PARAM) ?? '')),
    { initialValue: '' },
  );

  /**
   * The path is carried over from the current URL rather than rebuilt: this component sits on the
   * shell's route, so navigating relative to it would drop whichever child view is open.
   */
  protected search(value: string | null): void {
    const tree = this.router.parseUrl(this.router.url);
    const params = { ...tree.queryParams };

    if (value?.trim()) {
      params[QUERY_PARAM] = value;
    } else {
      // Removed rather than emptied: `?query=` in the address bar says a search is on when it is not.
      delete params[QUERY_PARAM];
    }

    tree.queryParams = params;

    void this.router.navigateByUrl(tree, { replaceUrl: true });
  }
}
