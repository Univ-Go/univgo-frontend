/**
 * The locales the application is compiled for. They have to match `angular.json`'s `i18n` block:
 * each one is a separate build served under its own base href, which is why switching language is a
 * navigation and not a runtime toggle.
 */
export interface AppLocale {
  readonly code: string;
  /** Endonym: a language is always listed in its own language, never translated. */
  readonly label: string;
}

export const APP_LOCALES: readonly AppLocale[] = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
];

/** Source locale of the translation, and the build a visitor lands on when nothing else matches. */
export const DEFAULT_LOCALE: AppLocale = APP_LOCALES[0];

/**
 * Reads the running locale from the base href the i18n build rewrites. A single-locale dev server
 * is served from `/`, which matches no locale and falls back to the source one.
 */
export function resolveLocale(baseHref: string): AppLocale {
  return APP_LOCALES.find((locale) => baseHref === `/${locale.code}/`) ?? DEFAULT_LOCALE;
}

/** Where the same route lives inside another locale's build. */
export function localePath(code: string, routeUrl: string): string {
  return `/${code}${routeUrl}`;
}
