import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withRouterConfig,
} from '@angular/router';
import { provideTaiga, tuiCheckboxOptionsProvider } from '@taiga-ui/core';
import { APP_CONFIG } from './core/config/app-config';
import { defaultAppConfig } from './core/config/default-app-config';
import { AdminBlockRepository } from './features/admin/domain/admin-block.repository';
import { CheckInScanner } from './features/admin/domain/check-in.scanner';
import { HttpAdminBlockRepository } from './features/admin/infrastructure/http-admin-block.repository';
import { HttpCheckInScanner } from './features/admin/infrastructure/http-check-in.scanner';
import { AuthRepository } from './features/auth/domain/auth.repository';
import { HttpAuthRepository } from './features/auth/infrastructure/http-auth.repository';
import { ReservationRepository } from './features/my-reservations/domain/reservation.repository';
import { HttpReservationRepository } from './features/my-reservations/infrastructure/http-reservation.repository';
import { SpaceRepository } from './features/spaces/domain/space.repository';
import { HttpSpaceRepository } from './features/spaces/infrastructure/http-space.repository';
import { authInterceptor } from './core/http/auth.interceptor';
import { httpErrorInterceptor } from './core/http/http-error.interceptor';
import { provideTaigaDateFormat } from './core/i18n/taiga-date-format';
import { provideTaigaLanguage } from './core/i18n/taiga-language';
import { ConsoleLogger, Logger } from './core/logging/logger';
import { PageMetadataStrategy } from './core/seo/page-metadata.strategy';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      // Binds route params directly to component inputs (e.g. the detail view's `id`), so a view
      // does not need to inject `ActivatedRoute` just to read one param.
      withComponentInputBinding(),
      // Angular's default only merges a parent's path params into a child's own paramMap when the
      // child's path is empty. The admin panel nests every view under `:spaceId`, so without this
      // `spaceId` would never reach `scan`/`blocks`/`settings`'s own paramMap for input binding to
      // read.
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
    // Order matters: responses unwind in reverse, so `authInterceptor` sees a 401 first and can
    // renew the session and replay the request before the error interceptor ever reports it.
    provideHttpClient(withFetch(), withInterceptors([httpErrorInterceptor, authInterceptor])),
    // Supplies the event plugins the library's own templates rely on and mirrors `TUI_DARK_MODE`
    // onto the document's `tuiTheme` attribute.
    provideTaiga(),
    provideTaigaLanguage(),
    provideTaigaDateFormat(),
    // "Selected" is teal product-wide, the same colour a filter in effect uses. Taiga's default
    // paints a checked box with the brand crimson, which reads as a primary action rather than as
    // a choice the user made. Configured through the library's options token, not with CSS.
    tuiCheckboxOptionsProvider({
      appearance: ({ checked }) => (checked ? 'accent' : 'outline-grayscale'),
    }),
    { provide: APP_CONFIG, useValue: defaultAppConfig },
    { provide: AuthRepository, useClass: HttpAuthRepository },
    { provide: SpaceRepository, useClass: HttpSpaceRepository },
    { provide: ReservationRepository, useClass: HttpReservationRepository },
    { provide: CheckInScanner, useClass: HttpCheckInScanner },
    { provide: AdminBlockRepository, useClass: HttpAdminBlockRepository },
    { provide: Logger, useClass: ConsoleLogger },
    { provide: TitleStrategy, useClass: PageMetadataStrategy },
  ],
};
