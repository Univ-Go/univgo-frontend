import { inject } from '@angular/core';
import type { CanActivateFn, CanDeactivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { TuiDialogService } from '@taiga-ui/core';
import { TUI_CONFIRM } from '@taiga-ui/kit';
import { defaultIfEmpty } from 'rxjs';
import { NotificationService } from '../../../core/notifications/notification.service';
import { MOCK_SPACES } from '../../spaces/infrastructure/mock-spaces';
import { BookingDraftStore } from './booking-draft.store';

const SPACE_STEP = ['/book', 'space'];

/**
 * The flow is strict forward and free backward, and these guards are what makes that true of the
 * URL and not only of the buttons: every step states what it needs, and a step reached without it —
 * typed, bookmarked, or reloaded — sends the user to the step that produces it instead of rendering
 * half a booking.
 *
 * Looking the space up from `MOCK_SPACES` is the same visual-mock shortcut the views take; it moves
 * behind a resolver over the spaces port once that API exists.
 */
export const bookingSpaceGuard: CanActivateFn = (route) => {
  const draft = inject(BookingDraftStore);
  const router = inject(Router);
  const notifications = inject(NotificationService);
  const id = route.paramMap.get('id');
  const space = MOCK_SPACES.find((candidate) => candidate.id === id);

  if (!space) {
    notifications.warn(
      $localize`:@@booking.unknownSpace.summary:No encontramos ese espacio`,
      $localize`:@@booking.unknownSpace.detail:Puede que el enlace sea antiguo. Elige un espacio del catálogo para continuar.`,
    );

    return router.createUrlTree(SPACE_STEP);
  }

  // The URL is the stronger statement of intent: opening a link for another space changes the
  // draft rather than being overridden by what the user picked before.
  draft.selectSpace(space);

  return true;
};

/**
 * What tells a new booking from the one in progress. Moving between steps keeps every answer;
 * arriving from outside the flow, or coming back to a step after a reservation was already
 * created, starts from an empty draft.
 *
 * This has to be explicit because the draft outlives the visit: a route's `providers` injector is
 * created once and cached on the route config rather than destroyed on deactivation. Without it,
 * "Nueva reserva" would open with last week's space still marked, and — worse — the created code
 * would live on, so the review step would keep bouncing to the outcome screen of a booking the
 * user already finished.
 *
 * `router.url` is still the URL being left while a guard runs, which is what makes "did we come
 * from inside the flow" answerable here.
 */
export const bookingRestartGuard: CanActivateFn = () => {
  const draft = inject(BookingDraftStore);
  const enteredFromOutside = !inject(Router).url.startsWith('/book');

  if (enteredFromOutside || draft.reservationCode()) {
    draft.reset();
  }

  return true;
};

/** Nothing to review until a day and an hour exist. */
export const bookingScheduledGuard: CanActivateFn = (route) => {
  const draft = inject(BookingDraftStore);
  const router = inject(Router);

  return draft.booking() ? true : router.createUrlTree(['/book', route.paramMap.get('id'), 'when']);
};

/** The outcome screen belongs to a reservation that was actually created in this session. */
export const bookingCreatedGuard: CanActivateFn = () =>
  inject(BookingDraftStore).reservationCode() ? true : inject(Router).createUrlTree(SPACE_STEP);

/**
 * Leaving the flow with a booking half made is worth one question — and only then: with nothing
 * chosen yet, or once the reservation exists, the exit is silent.
 *
 * It sits on the parent route, so it covers every way out at once: the navigation bar, the logo,
 * the browser's Back button and the flow's own Cancel action, which is a plain navigation home
 * rather than a second copy of this dialog. Moving between steps does not deactivate the parent,
 * so walking the flow never triggers it.
 *
 * `defaultIfEmpty` is not defensive noise: dismissing a Taiga dialog with Escape or the backdrop
 * completes it without emitting, and the router treats an empty guard result as an error.
 * Dismissing the question means staying.
 */
export const bookingLeaveGuard: CanDeactivateFn<unknown> = () => {
  if (!inject(BookingDraftStore).hasUnsavedChoice()) {
    return true;
  }

  return inject(TuiDialogService)
    .open<boolean>(TUI_CONFIRM, {
      size: 's',
      label: $localize`:@@booking.leave.title:¿Salir sin crear la reserva?`,
      data: {
        content: $localize`:@@booking.leave.content:Se perderá el espacio y el horario que elegiste.`,
        yes: $localize`:@@booking.leave.confirm:Salir`,
        no: $localize`:@@booking.leave.stay:Seguir aquí`,
        appearance: 'primary-destructive',
      },
    })
    .pipe(defaultIfEmpty(false));
};
