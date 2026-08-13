import type { Translation } from 'primeng/api';

/**
 * PrimeNG ships its own built-in strings (mostly accessibility labels) in English. Only the keys
 * actually reachable in the UI are translated here — extend this as components that expose new
 * built-in wording are adopted, such as the paginator or the date picker.
 */
export const primeNgTranslation: Translation = {
  aria: {
    navigation: $localize`:@@navigation.label:Navegación principal`,
  },
};
