import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Colour is defined once, here. PrimeNG emits this palette as `--p-*` custom properties and
 * `tailwindcss-primeui` re-exposes those same properties as Tailwind utilities, so PrimeNG
 * components and utility classes always resolve to identical values. A future tenant only needs
 * to supply a different palette to this preset — no component or stylesheet has to change.
 */
const primaryPalette = {
  50: '#eef4ff',
  100: '#dbe6fe',
  200: '#bfd3fe',
  300: '#93b4fd',
  400: '#608cfa',
  500: '#3b65f6',
  600: '#2544eb',
  700: '#1d33d8',
  800: '#1e2caf',
  900: '#1e2b8a',
  950: '#171d54',
} as const;

export const univegoThemePreset = definePreset(Aura, {
  semantic: {
    primary: primaryPalette,
    // WCAG 2.2 requires focus to stay perceivable; Aura's default ring is thinner than we want.
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{primary.color}',
      offset: '2px',
      shadow: 'none',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.600}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}',
        },
      },
      dark: {
        primary: {
          color: '{primary.400}',
          contrastColor: '{surface.950}',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
      },
    },
  },
});
