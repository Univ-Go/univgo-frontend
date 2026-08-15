import type { Routes } from '@angular/router';

/**
 * Every route declares `title` and `data.description`, which `PageMetadataStrategy` turns into
 * document metadata, so that no page can ship without a title.
 */
export const routes: Routes = [
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
    pathMatch: 'full',
    redirectTo: 'login',
  },
];
