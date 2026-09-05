import { computed, Directive, input } from '@angular/core';

import { BRAND_CUSTOM_PROPERTY, BrandPalette } from './brand-palette';

/**
 * Level 1: the bridge between a palette expressed as data and the custom properties the brand
 * artwork reads. It writes one inline custom property per colour it is actually given and nothing
 * else, so an absent field is not "the default value" — it is no declaration at all, and the SVG
 * falls back to its own.
 *
 * There is no colour arithmetic here on purpose. Deriving a lighter or darker shade is the
 * stylesheet's job inside the artwork, where it also applies to a palette set straight from CSS.
 */
@Directive({
  selector: '[appBrandColors]',
  host: { '[style]': 'customProperties()' },
})
export class BrandColors {
  readonly colors = input<BrandPalette>();

  protected readonly customProperties = computed(() =>
    Object.fromEntries(
      Object.entries(this.colors() ?? {})
        .filter(([, colour]) => !!colour)
        .map(([field, colour]) => [BRAND_CUSTOM_PROPERTY[field as keyof BrandPalette], colour]),
    ),
  );
}
