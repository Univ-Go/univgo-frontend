import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { MOCK_SPACE_PROFILES } from '../infrastructure/mock-attendance';

const SPACES_STEP = ['/admin', 'spaces'];

/**
 * Every view under `/admin/:spaceId` assumes the space is real; this is what makes that true of a
 * typed, bookmarked or reloaded URL and not only of links the panel generated itself. Sits on the
 * `:spaceId` route rather than on each leaf, so one check covers scanning, the block list, a block's
 * detail and settings alike.
 *
 * Looking the space up from `MOCK_SPACE_PROFILES` is the same visual-mock shortcut the views take;
 * it moves behind a port once the check-in API exists.
 */
export const adminSpaceGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const id = route.paramMap.get('spaceId');

  return MOCK_SPACE_PROFILES.some((space) => space.spaceId === id)
    ? true
    : router.createUrlTree(SPACES_STEP);
};
