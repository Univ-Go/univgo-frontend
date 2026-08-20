import type { Routes } from '@angular/router';
import { BookingDraftStore } from './application/booking-draft.store';
import {
  bookingCreatedGuard,
  bookingLeaveGuard,
  bookingRestartGuard,
  bookingScheduledGuard,
  bookingSpaceGuard,
} from './application/booking-flow.guards';

/**
 * The booking flow is one route tree so that the stepper has a single owner: `/book/space` renders
 * the very same catalogue as `/spaces`, only wrapped in the flow's frame, which is why picking a
 * space never needs a second, near-identical view. `data.step` is what the frame reads to know
 * where the user is, and the guards are what keep that honest when the URL is typed or reloaded.
 *
 * The tree is loaded with `loadChildren` rather than declared in `app.routes.ts`: the guards and
 * the draft store are eager code wherever they are named, and the route table is loaded at
 * bootstrap — declaring them there would put the flow's application layer, and the notification
 * service it depends on, in the initial bundle of every visit that never books anything.
 *
 * The draft is provided on the parent route so every step shares one instance: walking between
 * steps keeps every answer. It is not scoped to a single visit, though — a route's `providers`
 * injector is cached on the route config rather than destroyed on deactivation — so what starts a
 * clean booking is `bookingRestartGuard`, not leaving the page.
 */
export const BOOKING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/booking-flow-layout/booking-flow-layout').then(
        (m) => m.BookingFlowLayout,
      ),
    canDeactivate: [bookingLeaveGuard],
    providers: [BookingDraftStore],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'space',
      },
      {
        path: 'space',
        canActivate: [bookingRestartGuard],
        loadComponent: () =>
          import('../spaces/presentation/spaces-page/spaces-page').then((m) => m.SpacesPage),
        title: $localize`:@@booking.space.pageTitle:Elige un espacio`,
        data: {
          step: 0,
          description: $localize`:@@booking.space.pageDescription:Busca el espacio que necesitas y elígelo para continuar con tu reserva.`,
        },
      },
      {
        path: 'done',
        canActivate: [bookingCreatedGuard],
        loadComponent: () =>
          import('./presentation/booking-done-page/booking-done-page').then(
            (m) => m.BookingDonePage,
          ),
        title: $localize`:@@booking.done.pageTitle:Reserva creada`,
        data: {
          description: $localize`:@@booking.done.pageDescription:Tu reserva se creó correctamente. Consulta el código y el horario, o revisa todas tus reservas.`,
        },
      },
      {
        path: ':id/when',
        canActivate: [bookingRestartGuard, bookingSpaceGuard],
        loadComponent: () =>
          import('./presentation/booking-schedule-page/booking-schedule-page').then(
            (m) => m.BookingSchedulePage,
          ),
        title: $localize`:@@booking.schedule.pageTitle:Elige fecha y hora`,
        data: {
          step: 1,
          description: $localize`:@@booking.schedule.pageDescription:Elige el día y la hora de tu reserva, y consulta la información importante del espacio.`,
        },
      },
      {
        path: ':id/review',
        canActivate: [bookingRestartGuard, bookingSpaceGuard, bookingScheduledGuard],
        loadComponent: () =>
          import('./presentation/booking-review-page/booking-review-page').then(
            (m) => m.BookingReviewPage,
          ),
        title: $localize`:@@booking.review.pageTitle:Confirma tu reserva`,
        data: {
          step: 2,
          description: $localize`:@@booking.review.pageDescription:Revisa el espacio, la fecha y la hora antes de crear tu reserva.`,
        },
      },
    ],
  },
];
