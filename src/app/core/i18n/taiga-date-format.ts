import { LOCALE_ID, type Provider, inject, signal } from '@angular/core';
import { TUI_DATE_FORMAT } from '@taiga-ui/core';
import type { TuiDateFormatSettings } from '@taiga-ui/core';

/**
 * Taiga's default is `dd/mm/yyyy` with a `.` separator, which no locale this application ships
 * writes. The order and the separator are picked from the locale the build was compiled with, the
 * same way `provideTaigaLanguage` picks the language pack, so a date typed into a filter and a date
 * printed by Angular's `date` pipe never disagree about what `08` means.
 *
 * This drives the mask, the placeholder and every date Taiga renders, so it belongs at the
 * application root rather than on the views that happen to have a date field today.
 */
const SPANISH_DATE_FORMAT: TuiDateFormatSettings = { mode: 'dd/mm/yyyy', separator: '/' };
const ENGLISH_DATE_FORMAT: TuiDateFormatSettings = { mode: 'mm/dd/yyyy', separator: '/' };

export function provideTaigaDateFormat(): Provider {
  return {
    provide: TUI_DATE_FORMAT,
    useFactory: () =>
      signal(inject(LOCALE_ID).startsWith('en') ? ENGLISH_DATE_FORMAT : SPANISH_DATE_FORMAT),
  };
}
