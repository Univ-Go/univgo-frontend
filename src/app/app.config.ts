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
    // Supplies the event plugins the library's own templates rely on and mirrors `TUI_DARK_MODE`
    // onto the document's `tuiTheme` attribute.
    provideTaiga(),
    provideTaigaLanguage(),
    { provide: APP_CONFIG, useValue: defaultAppConfig },
    { provide: Logger, useClass: ConsoleLogger },
    { provide: TitleStrategy, useClass: PageMetadataStrategy },
  ],
};
