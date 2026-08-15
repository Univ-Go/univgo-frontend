import { LOCALE_ID, type Provider, inject, signal } from '@angular/core';
import { TUI_LANGUAGE } from '@taiga-ui/i18n';
import { TUI_ENGLISH_LANGUAGE } from '@taiga-ui/i18n/languages/english';
import { TUI_SPANISH_LANGUAGE } from '@taiga-ui/i18n/languages/spanish';

/**
 * Taiga UI ships its own wording — mostly accessibility labels — as language packs. The pack is
 * picked from the locale the build was compiled with, so it cannot drift from the project's own
 * translations.
 */
export function provideTaigaLanguage(): Provider {
  return {
    provide: TUI_LANGUAGE,
    useFactory: () =>
      signal(inject(LOCALE_ID).startsWith('en') ? TUI_ENGLISH_LANGUAGE : TUI_SPANISH_LANGUAGE),
  };
}
