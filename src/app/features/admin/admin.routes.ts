import type { Routes } from '@angular/router';

/**
 * The administrator's panel. `docs/booking-flow.md` §11 asks it for four things — scanning, the
 * current block, the day's other blocks and cancelling reservations — and only the second exists so
 * far; the rest are disabled in the aside rather than linked to routes that would fail the whole
 * navigation.
 *
 * Loaded with `loadChildren` so that neither the panel's shell nor its views reach the bundle of a
 * visit that only ever books a court.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'capacity',
  },
  {
    path: 'capacity',
    loadComponent: () =>
      import('./presentation/capacity-page/capacity-page').then((m) => m.CapacityPage),
    title: $localize`:@@admin.capacity.pageTitle:Gestión de aforo`,
    data: {
      description: $localize`:@@admin.capacity.pageDescription:Consulta el aforo del bloque actual, quién ha entrado y qué reservas siguen pendientes de check-in.`,
    },
  },
];
