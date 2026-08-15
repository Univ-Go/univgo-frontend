import { InjectionToken } from '@angular/core';

/**
 * Everything that varies per institution. Views must read identity and endpoints from here rather
 * than hardcoding them, so that serving a second tenant becomes a configuration change.
 */
export interface AppConfig {
  readonly tenantId: string;
  readonly organizationName: string;
  readonly apiBaseUrl: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
