import type { Routes } from '@angular/router';
import { adminSpaceGuard } from './application/admin-space.guard';
import { SpaceDraftStore } from './application/space-draft.store';
import {
  spaceWizardIdentityGuard,
  spaceWizardLeaveGuard,
  spaceWizardPhotosGuard,
  spaceWizardRestartGuard,
  spaceWizardSchedulesGuard,
  spaceWizardUsageGuard,
} from './application/space-wizard.guards';

/**
 * The administrator's panel. `docs/booking-flow.md` §11 asks it for five things — picking which
 * space to manage, scanning, a day's blocks, one block in detail and cancelling reservations — and
 * all five have a route. Managing the catalogue itself is the sixth, and the two routes it adds
 * (`spaces/new` and `spaces/:spaceId/edit`) are declared before `:spaceId` so the parameter cannot
 * swallow them.
 *
 * The space is a path segment (`:spaceId`) rather than a query param: `docs/booking-flow.md` §11
 * treats it as the subject every other screen is about, so it belongs in the address the same way
 * the block does, not beside it as an afterthought. The day's blocks and one block are still a list
 * and its detail rather than two views — the block in progress is the row the list opens on, not a
 * screen of its own — and which day it is still rides in the query string.
 *
 * Loaded with `loadChildren` so that neither the panel's shell nor its views reach the bundle of a
 * visit that only ever books a court.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    // §11: without a space chosen yet, the grid is the only thing there is to show.
    redirectTo: 'spaces',
  },
  {
    path: 'spaces',
    loadComponent: () =>
      import('./presentation/admin-spaces-page/admin-spaces-page').then((m) => m.AdminSpacesPage),
    title: $localize`:@@admin.spaces.pageTitle:Espacios`,
    data: {
      description: $localize`:@@admin.spaces.pageDescription:Elige el espacio que quieres gestionar: escanear accesos, consultar sus bloques o cambiar su configuración.`,
    },
  },
  {
    path: 'spaces/new',
    loadComponent: () =>
      import('./presentation/space-wizard-layout/space-wizard-layout').then(
        (m) => m.SpaceWizardLayout,
      ),
    canDeactivate: [spaceWizardLeaveGuard],
    // Provided here so the five steps share one draft: walking between them keeps every answer.
    // The injector is cached on the route config rather than destroyed on deactivation, which is
    // why a restart guard and not the navigation is what empties it.
    providers: [SpaceDraftStore],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'identity',
      },
      {
        path: 'identity',
        canActivate: [spaceWizardRestartGuard],
        loadComponent: () =>
          import('./presentation/space-wizard-identity-page/space-wizard-identity-page').then(
            (m) => m.SpaceWizardIdentityPage,
          ),
        title: $localize`:@@admin.spaceWizard.identity.pageTitle:Nuevo espacio: identidad`,
        data: {
          step: 0,
          description: $localize`:@@admin.spaceWizard.identity.pageDescription:Pon nombre, ubicación, tipo y aforo al espacio que vas a crear.`,
        },
      },
      {
        path: 'usage',
        canActivate: [spaceWizardRestartGuard, spaceWizardIdentityGuard],
        loadComponent: () =>
          import('./presentation/space-wizard-usage-page/space-wizard-usage-page').then(
            (m) => m.SpaceWizardUsagePage,
          ),
        title: $localize`:@@admin.spaceWizard.usage.pageTitle:Nuevo espacio: uso`,
        data: {
          step: 1,
          description: $localize`:@@admin.spaceWizard.usage.pageDescription:Describe para qué sirve el espacio y qué normas debe respetar quien lo reserva.`,
        },
      },
      {
        path: 'schedules',
        canActivate: [spaceWizardRestartGuard, spaceWizardIdentityGuard, spaceWizardUsageGuard],
        loadComponent: () =>
          import('./presentation/space-wizard-schedules-page/space-wizard-schedules-page').then(
            (m) => m.SpaceWizardSchedulesPage,
          ),
        title: $localize`:@@admin.spaceWizard.schedules.pageTitle:Nuevo espacio: horarios`,
        data: {
          step: 2,
          description: $localize`:@@admin.spaceWizard.schedules.pageDescription:Define las franjas horarias de cada día de la semana, que son las que generan los bloques reservables.`,
        },
      },
      {
        path: 'photos',
        canActivate: [
          spaceWizardRestartGuard,
          spaceWizardIdentityGuard,
          spaceWizardUsageGuard,
          spaceWizardSchedulesGuard,
        ],
        loadComponent: () =>
          import('./presentation/space-wizard-photos-page/space-wizard-photos-page').then(
            (m) => m.SpaceWizardPhotosPage,
          ),
        title: $localize`:@@admin.spaceWizard.photos.pageTitle:Nuevo espacio: fotos`,
        data: {
          step: 3,
          description: $localize`:@@admin.spaceWizard.photos.pageDescription:Sube las fotos del espacio y elige cuál será la portada del catálogo.`,
        },
      },
      {
        path: 'review',
        canActivate: [
          spaceWizardRestartGuard,
          spaceWizardIdentityGuard,
          spaceWizardUsageGuard,
          spaceWizardSchedulesGuard,
          spaceWizardPhotosGuard,
        ],
        loadComponent: () =>
          import('./presentation/space-wizard-review-page/space-wizard-review-page').then(
            (m) => m.SpaceWizardReviewPage,
          ),
        title: $localize`:@@admin.spaceWizard.review.pageTitle:Nuevo espacio: revisar y publicar`,
        data: {
          step: 4,
          description: $localize`:@@admin.spaceWizard.review.pageDescription:Revisa todos los datos del espacio antes de publicarlo en el catálogo.`,
        },
      },
    ],
  },
  {
    // Deliberately not behind `adminSpaceGuard`: that guard answers "can the panel operate this
    // space", and an archived one cannot — yet the edit screen is exactly where it is restored
    // from. An id that is not a space renders this page's own error state, which is the honest
    // answer for a stale link.
    path: 'spaces/:spaceId/edit',
    loadComponent: () =>
      import('./presentation/space-edit-page/space-edit-page').then((m) => m.SpaceEditPage),
    title: $localize`:@@admin.spaceEdit.pageTitle:Editar espacio`,
    data: {
      description: $localize`:@@admin.spaceEdit.pageDescription:Cambia la información, los horarios y las fotos de un espacio, o retíralo del catálogo.`,
    },
  },
  {
    path: ':spaceId',
    canActivate: [adminSpaceGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        // §11: scanning is "la pantalla principal y casi la única" — where an administrator's
        // session actually starts, not the roster they would only consult afterwards.
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
        loadComponent: () =>
          import('./presentation/blocks-page/blocks-page').then((m) => m.BlocksPage),
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
    ],
  },
];
