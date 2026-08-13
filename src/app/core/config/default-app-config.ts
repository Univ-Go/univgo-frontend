import { environment } from '../../../environments/environment';
import type { AppConfig } from './app-config';

/**
 * The active institution. `organizationName` is a placeholder until the real tenant is onboarded;
 * when the platform serves several universities this value stops being a constant and is resolved
 * per request instead, which is why nothing imports it directly except the `APP_CONFIG` provider.
 */
export const defaultAppConfig: AppConfig = {
  tenantId: 'default',
  organizationName: 'Universidad UnivGo',
  apiBaseUrl: environment.apiBaseUrl,
};
