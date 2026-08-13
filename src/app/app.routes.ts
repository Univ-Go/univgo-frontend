import type { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';

/**
 * Feature pages are lazily loaded so the initial bundle stays close to the shell. `title` and
 * `data.description` are consumed by `PageMetadataStrategy`, which is what keeps every route
 * indexable without per-component SEO code.
 */
export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/home/presentation/home-page').then((m) => m.HomePage),
        title: $localize`:@@home.pageTitle:Reserva de espacios`,
        data: {
          description: $localize`:@@home.metaDescription:Consulta la disponibilidad de instalaciones deportivas y salas de estudio de tu universidad y reserva en unos pocos pasos.`,
        },
      },
      {
        path: '**',
        loadComponent: () =>
          import('./features/not-found/presentation/not-found-page').then((m) => m.NotFoundPage),
        title: $localize`:@@notFound.pageTitle:Página no encontrada`,
        data: {
          description: $localize`:@@notFound.metaDescription:La página que buscas no está disponible.`,
        },
      },
    ],
  },
];
