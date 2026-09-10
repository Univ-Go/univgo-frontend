import type { Routes } from '@angular/router';

/**
 * The administrator's panel. `docs/booking-flow.md` §11 asks it for four things — scanning, the
 * current block, the day's other blocks and cancelling reservations. Scanning and the second now
 * exist; the day's other blocks and cancelling reservations are still disabled in the aside rather
 * than linked to routes that would fail the whole navigation.
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
    path: 'capacity',
    loadComponent: () =>
      import('./presentation/capacity-page/capacity-page').then((m) => m.CapacityPage),
    title: $localize`:@@admin.capacity.pageTitle:Gestión de aforo`,
    data: {
      description: $localize`:@@admin.capacity.pageDescription:Consulta el aforo del bloque actual, quién ha entrado y qué reservas siguen pendientes de check-in.`,
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
