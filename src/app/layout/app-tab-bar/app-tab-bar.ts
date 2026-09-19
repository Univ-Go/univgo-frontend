import { ChangeDetectionStrategy, Component, booleanAttribute, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { ActivatedRouteSnapshot, IsActiveMatchOptions } from '@angular/router';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { filter, map, startWith } from 'rxjs';
import { currentAdminSpaceId } from '../../features/admin/application/admin-space-context';
import { ADMIN_NAV_ITEMS, ADMIN_NAV_MATCH_OPTIONS } from '../admin-nav-items';

/**
 * Whether the shell should offer its quick action here. Every level of the tree is asked, not just
 * the deepest: a route that opts out does so for everything under it, and Angular's default
 * inheritance does not hand a parent's `data` to a child that has a path of its own.
 */
function allowsQuickAction(root: ActivatedRouteSnapshot): boolean {
  let route: ActivatedRouteSnapshot | null = root;

  while (route) {
    if (route.data['quickAction'] === false) {
      return false;
    }

    route = route.firstChild;
  }

  return true;
}

/**
 * Level 1: the phone's navigation. A bar pinned to the bottom puts every destination inside the
 * thumb's reach, which the top bar never was, and a destination added or removed is a column more
 * or less without redesigning anything.
 *
 * Both shells use it: the `admin` input swaps the destination set and the centre action for the
 * panel's own (`ADMIN_NAV_ITEMS`, and booking on a student's behalf instead of a new reservation),
 * but the shape — equal columns with a raised action among them — does not change. Splitting it
 * into two components would duplicate that shape for no reason two data-driven branches do not
 * already cover.
 *
 * The bar itself is destinations only. The account and the utilities used to hang off a last tab
 * here, which made them reachable from the bar on a phone and from the top bar everywhere else;
 * both shells now keep them in their own bar at every width, and the panel's variant never had that
 * tab to begin with. The quick action floats beside the bar rather than sitting in it.
 *
 * Not a Taiga component: the library ships tabs for switching content inside a view
 * (`tuiTabs`, `tui-segmented`), not a bottom navigation bar, so this is built from Taiga's own
 * button and icon primitives rather than replacing them.
 *
 * The raised button is the one action a person repeats every day, so it sits near the centre of
 * the bar where either thumb reaches it, and it is a link rather than a button so it behaves like
 * every other destination — long press, open in a new tab, the lot. The admin variant keeps it a
 * button instead: the flow it would link to does not exist yet.
 */
@Component({
  selector: 'app-tab-bar',
  imports: [RouterLink, RouterLinkActive, TuiButton, TuiIcon],
  templateUrl: './app-tab-bar.html',
  styleUrl: './app-tab-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppTabBar {
  private readonly router = inject(Router);

  public readonly admin = input(false, { transform: booleanAttribute });

  /**
   * Which views drop the quick action is declared by the routes (`data.quickAction`), not matched
   * on the path here and not read off the DOM: an earlier attempt hid it wherever a `tui-action-bar`
   * was on screen, which missed the first step of the booking flow, where no bar is raised until a
   * space is picked.
   */
  protected readonly quickAction = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => allowsQuickAction(this.router.routerState.snapshot.root)),
    ),
    { initialValue: allowsQuickAction(this.router.routerState.snapshot.root) },
  );

  protected readonly adminItems = ADMIN_NAV_ITEMS;
  protected readonly adminMatchOptions = ADMIN_NAV_MATCH_OPTIONS;
  protected readonly adminSpaceId = currentAdminSpaceId();

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
}
