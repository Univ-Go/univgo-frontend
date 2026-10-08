import { inject } from '@angular/core';
import type { CanActivateFn, CanDeactivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { TuiDialogService } from '@taiga-ui/core';
import { TUI_CONFIRM } from '@taiga-ui/kit';
import { defaultIfEmpty } from 'rxjs';
import {
  arePhotosComplete,
  isIdentityComplete,
  isSchedulesComplete,
  isUsageComplete,
} from '../domain/space-draft';
import { SpaceDraftStore } from './space-draft.store';

const WIZARD_URL = '/admin/spaces/new';

const IDENTITY_STEP = ['/admin', 'spaces', 'new', 'identity'];
const USAGE_STEP = ['/admin', 'spaces', 'new', 'usage'];
const SCHEDULES_STEP = ['/admin', 'spaces', 'new', 'schedules'];
const PHOTOS_STEP = ['/admin', 'spaces', 'new', 'photos'];

/**
 * The wizard is strict forward and free backward, and these guards are what makes that true of the
 * URL rather than only of the buttons: a step reached without what it needs — typed, bookmarked or
 * reloaded — sends the administrator to the step that produces it.
 *
 * Each one redirects to the step that is missing data, not to the first, and they stack: arriving at
 * the review step with an empty draft lands on the identity step in one hop.
 */
export const spaceWizardIdentityGuard: CanActivateFn = () =>
  isIdentityComplete(inject(SpaceDraftStore).identity())
    ? true
    : inject(Router).createUrlTree(IDENTITY_STEP);

export const spaceWizardUsageGuard: CanActivateFn = () =>
  isUsageComplete(inject(SpaceDraftStore).usage())
    ? true
    : inject(Router).createUrlTree(USAGE_STEP);

export const spaceWizardSchedulesGuard: CanActivateFn = () =>
  isSchedulesComplete(inject(SpaceDraftStore).schedules())
    ? true
    : inject(Router).createUrlTree(SCHEDULES_STEP);

export const spaceWizardPhotosGuard: CanActivateFn = () =>
  arePhotosComplete(inject(SpaceDraftStore).photos())
    ? true
    : inject(Router).createUrlTree(PHOTOS_STEP);

/**
 * What tells a new space from the one being created. Moving between steps keeps every answer;
 * arriving from outside the wizard, or coming back after a space was already created, starts empty.
 *
 * This has to be explicit because the draft outlives the visit: a route's `providers` injector is
 * created once and cached on the route config rather than destroyed on deactivation. Without it,
 * "Crear espacio" would open with the last space half typed and still holding its photographs.
 *
 * `router.url` is still the URL being left while a guard runs, which is what makes "did we come from
 * inside the wizard" answerable here.
 */
export const spaceWizardRestartGuard: CanActivateFn = () => {
  const draft = inject(SpaceDraftStore);
  const enteredFromOutside = !inject(Router).url.startsWith(WIZARD_URL);

  if (enteredFromOutside || draft.space()) {
    draft.reset();
  }

  return true;
};

/**
 * Leaving with a space half described is worth one question — and only then: with nothing typed yet,
 * or once the space exists, the exit is silent.
 *
 * It sits on the parent route, so it covers every way out at once: the sidebar, the logo, the
 * browser's Back button and the wizard's own Cancel. Moving between steps does not deactivate the
 * parent, so walking the wizard never triggers it.
 *
 * `defaultIfEmpty` is not defensive noise: dismissing a Taiga dialog with Escape or the backdrop
 * completes it without emitting, and the router treats an empty guard result as an error. Dismissing
 * the question means staying.
 */
export const spaceWizardLeaveGuard: CanDeactivateFn<unknown> = () => {
  if (!inject(SpaceDraftStore).hasUnsavedChoice()) {
    return true;
  }

  return inject(TuiDialogService)
    .open<boolean>(TUI_CONFIRM, {
      size: 's',
      label: $localize`:@@admin.spaceWizard.leave.title:¿Salir sin crear el espacio?`,
      data: {
        content: $localize`:@@admin.spaceWizard.leave.content:Se perderá todo lo que escribiste, incluidas las fotos que subiste.`,
        yes: $localize`:@@admin.spaceWizard.leave.confirm:Salir`,
        no: $localize`:@@admin.spaceWizard.leave.stay:Seguir aquí`,
        appearance: 'primary-destructive',
      },
    })
    .pipe(defaultIfEmpty(false));
};
