import type { Route } from '@angular/router';

/** Mounted in both shells: every account has a profile, whichever role signed in. */
export const PROFILE_ROUTE: Route = {
  path: 'profile',
  loadComponent: () =>
    import('./presentation/profile-page/profile-page').then((m) => m.ProfilePage),
  title: $localize`:@@profile.pageTitle:Tu perfil`,
  data: {
    description: $localize`:@@profile.pageDescription:Gestiona tu cuenta y cambia tu contraseña.`,
  },
};
