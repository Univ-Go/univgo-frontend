import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { TitleStrategy, provideRouter, withInMemoryScrolling } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import { environment } from '../environments/environment';
import { APP_CONFIG } from './core/config/app-config';
import { defaultAppConfig } from './core/config/default-app-config';
import { httpErrorInterceptor } from './core/http/http-error.interceptor';
import { primeNgTranslation } from './core/i18n/primeng-translation';
import { ConsoleLogger, Logger } from './core/logging/logger';
import { PageMetadataStrategy } from './core/seo/page-metadata.strategy';
import { univegoThemePreset } from './core/theme/univego-theme.preset';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(withFetch(), withInterceptors([httpErrorInterceptor])),
    providePrimeNG({
      license: environment.primeUiLicense,
      translation: primeNgTranslation,
      theme: {
        preset: univegoThemePreset,
        options: {
          darkModeSelector: '[data-theme="dark"]',
          // Keeps PrimeNG's generated rules below Tailwind utilities so utility overrides win.
          cssLayer: { name: 'primeng', order: 'theme, base, primeng, components, utilities' },
        },
      },
    }),
    MessageService,
    { provide: APP_CONFIG, useValue: defaultAppConfig },
    { provide: Logger, useClass: ConsoleLogger },
    { provide: TitleStrategy, useClass: PageMetadataStrategy },
  ],
};
