/**
 * The eight colours the brand artwork is drawn with. Every field is optional: whatever is left out
 * keeps the value the SVG resolves on its own, which for the base colours is the institutional
 * palette and for the six variants is a shade derived from those bases.
 *
 * Supplying only `primary` and `secondary` is therefore enough to recolour the whole mark — a
 * monochrome or single-hue version keeps its shading instead of flattening. The variants exist for
 * the cases where a derived shade is not what is wanted, a flat one-colour silhouette being the
 * obvious one.
 *
 * The colour system itself lives in the artwork, in the `<style>` block of the two SVG files, so
 * the files render correctly opened on their own and recolour identically whether they are driven
 * from here or straight from a stylesheet. Three things about it are worth not rediscovering:
 *
 * - Each colour is declared in two tiers, `--primary: var(--univgo-logo-primary, #B40520)`. One
 *   tier cannot work: a custom property that falls back to itself is a cycle, and CSS resolves the
 *   whole declaration to nothing rather than to the fallback.
 * - The six variants derive from the two bases through relative colour syntax in OKLCH, with the
 *   lightness and chroma factors measured off the original artwork. Feeding them the institutional
 *   colours reproduces it to within 6/255 on a single channel, so deriving costs no fidelity. The
 *   plain hex values are the fallback for engines without relative colour syntax.
 * - The rule is keyed on a class rather than on `svg`. Angular keeps a `<style>` that sits inside
 *   an `<svg>` as a DOM element instead of hoisting it into the component's scoped sheet, so a
 *   bare element selector there would reach every SVG on the page.
 */
export interface BrandPalette {
  readonly primary?: string;
  readonly primaryLight?: string;
  readonly primaryDark?: string;
  readonly primaryDarker?: string;
  readonly secondary?: string;
  readonly secondaryLight?: string;
  readonly secondaryDark?: string;
  readonly secondaryDarker?: string;
}

export const BRAND_CUSTOM_PROPERTY: Readonly<Record<keyof BrandPalette, string>> = {
  primary: '--univgo-logo-primary',
  primaryLight: '--univgo-logo-primary-light',
  primaryDark: '--univgo-logo-primary-dark',
  primaryDarker: '--univgo-logo-primary-darker',
  secondary: '--univgo-logo-secondary',
  secondaryLight: '--univgo-logo-secondary-light',
  secondaryDark: '--univgo-logo-secondary-dark',
  secondaryDarker: '--univgo-logo-secondary-darker',
};
