import type { Routes } from '@angular/router';

/**
 * The administrator's panel. `docs/booking-flow.md` §11 asks it for four things — scanning, a day's
 * blocks, one block in detail and cancelling reservations — and all four now have a route.
 *
 * The day's blocks and one block are a list and its detail rather than two views: the block in
 * progress is the row the list opens on, not a screen of its own. Which space and which day ride in
 * the query string, so going back from the detail is dropping a segment.
 *
 * Loaded with `loadChildren` so that neither the panel's shell nor its views reach the bundle of a
 * visit that only ever books a court.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    // §11: scanning is "la pantalla principal y casi la única" — where an administrator's session
    // actually starts, not the roster they would only consult afterwards.
    redirectTo: 'scan',
  },
  {
    path: 'scan',
    loadComponent: () => import('./presentation/scan-page/scan-page').then((m) => m.ScanPage),
    title: $localize`:@@admin.scan.pageTitle:Escáner de acceso`,
    data: {
      description: $localize`:@@admin.scan.pageDescription:Escanea el código de un estudiante para registrar su check-in y confirmar el acceso al espacio.`,
    },
  },
  {
    path: 'blocks',
    loadComponent: () => import('./presentation/blocks-page/blocks-page').then((m) => m.BlocksPage),
    title: $localize`:@@admin.blocks.pageTitle:Consulta de bloques`,
    data: {
      description: $localize`:@@admin.blocks.pageDescription:Consulta los bloques de un espacio para un día concreto, con su aforo previsto, quién está dentro y quién asistió.`,
    },
  },
  {
    path: 'blocks/:block',
    loadComponent: () =>
      import('./presentation/capacity-detail-page/capacity-detail-page').then(
        (m) => m.CapacityDetailPage,
      ),
    title: $localize`:@@admin.capacity.detail.pageTitle:Detalle del bloque`,
    data: {
      // The only view that consumes the shell's search box, which is how `AdminHeader` knows to
      // render it here and to leave it out of the views where it would do nothing.
      search: true,
      description: $localize`:@@admin.capacity.detail.pageDescription:Consulta el aforo de un bloque, quién ha entrado y qué reservas siguen pendientes de check-in.`,
    },
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./presentation/settings-page/settings-page').then((m) => m.SettingsPage),
    title: $localize`:@@admin.settings.pageTitle:Configuración y cancelación de espacio`,
    data: {
      description: $localize`:@@admin.settings.pageDescription:Registra el cierre de un espacio por mantenimiento o incidencias y consulta el historial de cierres.`,
    },
  },
];
