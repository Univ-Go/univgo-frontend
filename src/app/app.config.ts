import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { TitleStrategy, provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { APP_CONFIG } from './core/config/app-config';
import { defaultAppConfig } from './core/config/default-app-config';
import { httpErrorInterceptor } from './core/http/http-error.interceptor';
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
    ),
    provideHttpClient(withFetch(), withInterceptors([httpErrorInterceptor])),
    // Aporta los plugins de evento que necesitan las plantillas de la librería y engancha
    // `TUI_DARK_MODE` al atributo `tuiTheme` del documento.
    provideTaiga(),
    provideTaigaLanguage(),
    { provide: APP_CONFIG, useValue: defaultAppConfig },
    { provide: Logger, useClass: ConsoleLogger },
    { provide: TitleStrategy, useClass: PageMetadataStrategy },
  ],
};
