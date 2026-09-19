import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import type { ActivatedRouteSnapshot } from '@angular/router';
import { TUI_BREAKPOINT, TuiButton, TuiDropdown, TuiInput } from '@taiga-ui/core';
import { TuiAvatar } from '@taiga-ui/kit';
import { filter, map, startWith } from 'rxjs';
import { currentAdminSpaceId } from '../../features/admin/application/admin-space-context';
import { AdminSpacesStore } from '../../features/admin/application/admin-spaces.store';
import { withSpaceId } from '../../features/admin/domain/admin-navigation';
import { SpaceSwitcher } from '../../features/admin/presentation/space-switcher/space-switcher';
import { SessionStore } from '../../features/auth/application/session-store';
import { BrandIsotype } from '../../shared/brand/brand-isotype';
import { BrandLogo } from '../../shared/brand/brand-logo';
import { LanguageSelector } from '../../shared/language-selector/language-selector';
import { ThemeToggle } from '../../shared/theme-toggle/theme-toggle';
import { AccountMenu } from '../account-menu/account-menu';

/** The query-string key the roster reads its search from. */
const QUERY_PARAM = 'query';

function deepest(root: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  let route = root;

  while (route.firstChild) {
    route = route.firstChild;
  }

  return route;
}

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
 *
 * The field only appears where something reads it. Which views those are is declared by the routes
 * themselves (`data.search`) rather than listed here, so the bar narrows the view underneath without
 * knowing which view it is — the same arrangement `PageMetadataStrategy` already uses for titles. A
 * box that did nothing on three of the panel's five screens would be a control with no feedback,
 * which is the one thing §7 will not have.
 *
 * The space switcher lives here for the same reason `docs/booking-flow.md` §11 gives: which space is
 * open is the panel's subject, not one screen's. Switching it rewrites the current URL in place
 * (`withSpaceId`) rather than navigating to a fixed destination, so the section the administrator was
 * already on stays open, now about a different space. It is absent, not disabled, on `/admin/spaces`,
 * where there is no current space to switch.
 */
@Component({
  selector: 'app-admin-header',
  imports: [
    AccountMenu,
    BrandIsotype,
    BrandLogo,
    FormsModule,
    LanguageSelector,
    RouterLink,
    SpaceSwitcher,
    ThemeToggle,
    TuiAvatar,
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

  private readonly session = inject(SessionStore);

  private readonly breakpoint = inject(TUI_BREAKPOINT);

  /**
   * On a phone the switcher takes a line of its own. Taiga's button sets `flex-shrink: 0` and the
   * trigger needs around 12rem to name a space, so the first row would have to be some 525px wide
   * to hold it beside the mark and the controls — more than any phone has. The fold is a threshold
   * rather than the wrap flexbox would do by itself, because flexbox wraps the *last* item on the
   * line and what has to come down here is the one in the middle.
   */
  protected readonly compact = computed(() => this.breakpoint() === 'mobile');

  protected readonly initials = computed(() => this.session.user()?.firstName.slice(0, 1) ?? '');

  protected readonly menuOpen = signal(false);

  /**
   * The switcher only has to offer the other spaces, and the guard on `:spaceId` has already read
   * the catalogue by the time the shell renders, so this resolves from the store's cache rather
   * than costing a request of its own. An empty list while it is in flight leaves the trigger
   * naming the current space and nothing to switch to, which is the truth for that instant.
   */
  protected readonly spaces = toSignal(inject(AdminSpacesStore).list(), { initialValue: [] });

  protected readonly currentSpaceId = currentAdminSpaceId();

  protected readonly query = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get(QUERY_PARAM) ?? '')),
    { initialValue: '' },
  );

  protected readonly searchable = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => deepest(this.router.routerState.snapshot.root).data['search'] === true),
    ),
    { initialValue: false },
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

  protected changeSpace(nextSpaceId: string): void {
    const current = this.currentSpaceId();

    if (current === null) {
      return;
    }

    void this.router.navigateByUrl(withSpaceId(this.router.url, current, nextSpaceId));
  }
}
