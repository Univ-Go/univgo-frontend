import type { Routes } from '@angular/router';

/**
 * Every route declares `title` and `data.description`, which `PageMetadataStrategy` turns into
 * document metadata, so that no page can ship without a title. Sign-in sits outside the shell:
 * a navigation bar is meaningless before there is a session.
 *
 * TEMPORARY: the entry point redirects to sign-in and the mock buttons walk between the two views,
 * so the flow can be clicked through. Real guards replace this once authentication exists.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/presentation/login-page/login-page').then((m) => m.LoginPage),
    title: $localize`:@@auth.login.pageTitle:Inicia sesión`,
    data: {
      description: $localize`:@@auth.login.pageDescription:Accede con las credenciales de tu universidad para reservar espacios deportivos y de estudio.`,
    },
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      {
        path: 'inicio',
        loadComponent: () =>
          import('./features/home/presentation/home-page/home-page').then((m) => m.HomePage),
        title: $localize`:@@home.pageTitle:Inicio`,
        data: {
          description: $localize`:@@home.pageDescription:Consulta tu próxima reserva y los espacios destacados del campus.`,
        },
      },
      {
        path: 'reservas',
        loadComponent: () =>
          import('./features/my-reservations/presentation/my-reservations-page/my-reservations-page').then(
            (m) => m.MyReservationsPage,
          ),
        title: $localize`:@@reservations.pageTitle:Mis reservas`,
        data: {
          description: $localize`:@@reservations.pageDescription:Consulta, filtra y gestiona las reservas que has hecho en el campus.`,
        },
      },
    ],
  },
];
