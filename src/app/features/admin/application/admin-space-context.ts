import type { Signal } from '@angular/core';
import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { ActivatedRouteSnapshot } from '@angular/router';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

/** Walks the route tree for the `spaceId` owned by the panel's `:spaceId` route, wherever the
 *  navigation currently sits below it. `null` on `/admin/spaces`, where there is no current space. */
export function spaceIdFromSnapshot(root: ActivatedRouteSnapshot): string | null {
  let route: ActivatedRouteSnapshot | null = root;

  while (route) {
    const id = route.paramMap.get('spaceId');

    if (id !== null) {
      return id;
    }

    route = route.firstChild;
  }

  return null;
}

/**
 * The panel's current space as a signal, shared by every Level 1 shell piece that needs it
 * (`AdminHeader`, `AdminAside`, `AppTabBar`) instead of each walking the route tree on its own —
 * the same shape `AdminHeader` already used privately for its search-box visibility.
 */
export function currentAdminSpaceId(): Signal<string | null> {
  const router = inject(Router);

  return toSignal(
    router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => spaceIdFromSnapshot(router.routerState.snapshot.root)),
    ),
    { initialValue: spaceIdFromSnapshot(router.routerState.snapshot.root) },
  );
}
