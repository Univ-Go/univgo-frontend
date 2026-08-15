import { LOCALE_ID, type Provider, inject, signal } from '@angular/core';
import { TUI_LANGUAGE } from '@taiga-ui/i18n';
import { TUI_ENGLISH_LANGUAGE } from '@taiga-ui/i18n/languages/english';
import { TUI_SPANISH_LANGUAGE } from '@taiga-ui/i18n/languages/spanish';

/**
 * Taiga UI distribuye sus propios textos —sobre todo etiquetas de accesibilidad— en paquetes de
 * idioma. El paquete se elige desde el locale con el que se compiló la build, de modo que no puede
 * desincronizarse de las traducciones propias.
 */
export function provideTaigaLanguage(): Provider {
  return {
    provide: TUI_LANGUAGE,
    useFactory: () =>
      signal(inject(LOCALE_ID).startsWith('en') ? TUI_ENGLISH_LANGUAGE : TUI_SPANISH_LANGUAGE),
  };
}
