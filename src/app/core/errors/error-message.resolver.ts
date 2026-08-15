import type { AppErrorCode } from './app-error';

export interface UserFacingMessage {
  readonly summary: string;
  readonly detail: string;
}

/**
 * Turns an error code into wording a student can act on. Every branch answers the same three
 * questions: what happened, whether it is their turn to do something, and how to continue.
 */
export function resolveErrorMessage(code: AppErrorCode): UserFacingMessage {
  switch (code) {
    case 'network':
      return {
        summary: $localize`:@@error.network.summary:Sin conexión`,
        detail: $localize`:@@error.network.detail:No hemos podido conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.`,
      };
    case 'unauthorized':
      return {
        summary: $localize`:@@error.unauthorized.summary:Sesión caducada`,
        detail: $localize`:@@error.unauthorized.detail:Tu sesión ha caducado. Vuelve a iniciar sesión para continuar.`,
      };
    case 'forbidden':
      return {
        summary: $localize`:@@error.forbidden.summary:Sin permisos`,
        detail: $localize`:@@error.forbidden.detail:No tienes permiso para realizar esta acción. Si crees que se trata de un error, contacta con tu universidad.`,
      };
    case 'notFound':
      return {
        summary: $localize`:@@error.notFound.summary:No encontrado`,
        detail: $localize`:@@error.notFound.detail:No hemos encontrado la información que buscabas. Es posible que ya no esté disponible.`,
      };
    case 'conflict':
      return {
        summary: $localize`:@@error.conflict.summary:La información ha cambiado`,
        detail: $localize`:@@error.conflict.detail:Otra persona se ha adelantado y los datos han cambiado. Actualiza la página e inténtalo de nuevo.`,
      };
    case 'validation':
      return {
        summary: $localize`:@@error.validation.summary:Revisa los datos`,
        detail: $localize`:@@error.validation.detail:Algunos datos no son correctos. Revísalos e inténtalo de nuevo.`,
      };
    case 'rateLimited':
      return {
        summary: $localize`:@@error.rateLimited.summary:Demasiados intentos`,
        detail: $localize`:@@error.rateLimited.detail:Has hecho muchas solicitudes seguidas. Espera unos segundos e inténtalo de nuevo.`,
      };
    case 'server':
      return {
        summary: $localize`:@@error.server.summary:Algo ha fallado`,
        detail: $localize`:@@error.server.detail:Estamos teniendo un problema técnico. Inténtalo de nuevo en unos minutos.`,
      };
    default:
      return {
        summary: $localize`:@@error.unknown.summary:Algo ha fallado`,
        detail: $localize`:@@error.unknown.detail:No hemos podido completar la operación. Inténtalo de nuevo.`,
      };
  }
}
