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
