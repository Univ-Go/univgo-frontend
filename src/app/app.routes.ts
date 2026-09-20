import type { Routes } from '@angular/router';
import { adminGuard, guestGuard, studentGuard } from './features/auth/application/auth.guards';

/**
 * Every route declares `title` and `data.description`, which `PageMetadataStrategy` turns into
 * document metadata, so that no page can ship without a title. Sign-in sits outside the shell:
 * a navigation bar is meaningless before there is a session.
 *
 * The entry point redirects to sign-in, where `guestGuard` forwards anyone who already has a
 * session on to the landing page their role calls for.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/presentation/login-page/login-page').then((m) => m.LoginPage),
    title: $localize`:@@auth.login.pageTitle:Inicia sesión`,
    data: {
      description: $localize`:@@auth.login.pageDescription:Accede con las credenciales de tu universidad para reservar espacios deportivos y de estudio.`,
    },
  },
  // The panel has its own shell, so it hangs off the root rather than off the student's: it answers
  // to a different person, and a tab bar within reach of a thumb is not what a desk tool needs.
  {
    path: 'admin',
    // `canActivate` alone fires only when the shell is entered: Angular reuses a parent whose child
    // changes, so moving between views inside it would never check the session again.
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    loadComponent: () => import('./layout/admin-layout/admin-layout').then((m) => m.AdminLayout),
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '',
    canActivate: [studentGuard],
    canActivateChild: [studentGuard],
    loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/presentation/home-page/home-page').then((m) => m.HomePage),
        title: $localize`:@@home.pageTitle:Inicio`,
        data: {
          description: $localize`:@@home.pageDescription:Consulta tu próxima reserva y los espacios destacados del campus.`,
        },
      },
      {
        path: 'spaces',
        loadComponent: () =>
          import('./features/spaces/presentation/spaces-page/spaces-page').then(
            (m) => m.SpacesPage,
          ),
        title: $localize`:@@spaces.pageTitle:Espacios`,
        data: {
          description: $localize`:@@spaces.pageDescription:Consulta los espacios deportivos, salas de estudio y laboratorios del campus, y reserva el que necesites.`,
        },
      },
      {
        // After `spaces` so the list keeps its own path, and with the id as a parameter because a
        // space's page is an address a student can share.
        path: 'spaces/:id',
        loadComponent: () =>
          import('./features/spaces/presentation/space-detail-page/space-detail-page').then(
            (m) => m.SpaceDetailPage,
          ),
        title: $localize`:@@spaces.detail.pageTitle:Detalle del espacio`,
        data: {
          description: $localize`:@@spaces.detail.pageDescription:Consulta las fotos, el aforo, el uso y las normas del espacio antes de reservarlo.`,
        },
      },
      {
        path: 'book',
        // The shell's quick action is a shortcut into this flow, so it has nothing to offer once
        // somebody is inside it. Declared here rather than matched on the path by `AppTabBar`,
        // which would make the shell know what a booking URL looks like — the same arrangement
        // `PageMetadataStrategy` and the panel's search box already use.
        data: { quickAction: false },
        loadChildren: () =>
          import('./features/booking/booking.routes').then((m) => m.BOOKING_ROUTES),
      },
      {
        path: 'reservations',
        loadComponent: () =>
          import('./features/my-reservations/presentation/my-reservations-page/my-reservations-page').then(
            (m) => m.MyReservationsPage,
          ),
        title: $localize`:@@reservations.pageTitle:Mis reservas`,
        data: {
          description: $localize`:@@reservations.pageDescription:Consulta, filtra y gestiona las reservas que has hecho en el campus.`,
        },
      },
      {
        path: 'reservations/:id',
        loadComponent: () =>
          import('./features/my-reservations/presentation/reservation-detail-page/reservation-detail-page').then(
            (m) => m.ReservationDetailPage,
          ),
        title: $localize`:@@reservations.detail.pageTitle:Detalle de la reserva`,
        data: {
          description: $localize`:@@reservations.detail.pageDescription:Consulta el pase, el horario, la ubicación y las normas de tu reserva.`,
        },
      },
      // Last, and inside the shell: an unknown URL leaves the user with the navigation bar rather
      // than on a blank page. Without this entry the router aborts the navigation and renders
      // nothing at all.
      {
        path: '**',
        loadComponent: () =>
          import('./features/not-found/presentation/not-found-page/not-found-page').then(
            (m) => m.NotFoundPage,
          ),
        title: $localize`:@@notFound.pageTitle:Página no encontrada`,
        data: {
          description: $localize`:@@notFound.pageDescription:La página que buscas no existe o ha cambiado de dirección. Vuelve al inicio o consulta tus reservas.`,
        },
      },
    ],
  },
];
