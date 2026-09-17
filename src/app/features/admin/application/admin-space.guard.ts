import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { AdminSpacesStore } from './admin-spaces.store';

const SPACES_STEP = ['/admin', 'spaces'];

/**
 * Every view under `/admin/:spaceId` assumes the space is real; this is what makes that true of a
 * typed, bookmarked or reloaded URL and not only of links the panel generated itself. Sits on the
 * `:spaceId` route rather than on each leaf, so one check covers scanning, the block list, a block's
 * detail and settings alike.
 *
 * The answer comes from the catalogue, through the store that already holds it, so this costs a
 * request only the first time the panel is opened.
 */
export const adminSpaceGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const id = route.paramMap.get('spaceId');

  if (!id) {
    return router.createUrlTree(SPACES_STEP);
  }

  return inject(AdminSpacesStore)
    .find(id)
    .pipe(map((space) => (space ? true : router.createUrlTree(SPACES_STEP))));
};
