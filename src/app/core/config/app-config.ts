import { InjectionToken } from '@angular/core';

/**
 * Everything that varies per institution. Views must read identity and endpoints from here rather
 * than hardcoding them, so that serving a second tenant becomes a configuration change.
 */
export interface AppConfig {
  readonly tenantId: string;
  readonly organizationName: string;
  readonly apiBaseUrl: string;
  /**
   * Where the session endpoints answer. It is not `${apiBaseUrl}/auth`: the server scopes the
   * refresh cookie to `Path=/auth`, so the browser only sends it to URLs under that path, and a
   * proxy that served them under another prefix would silently break every renewal.
   */
  readonly authBaseUrl: string;
  /** How many days back the panel can open a day of blocks for. `docs/booking-flow.md` §3. */
  readonly capacityHistoryDays: number;
  /**
   * How many days forward. Never below the student's booking horizon, or the panel could not show a
   * block a student has already reserved.
   */
  readonly capacityPlanningDays: number;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
