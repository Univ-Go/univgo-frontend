import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Level 1: the wordmark. The application bar, the footer and the sign-in panel all showed it, each
 * repeating the file, its intrinsic size and the plate it sits on. This is the one place that
 * knows which image the product is signed with — which is also the place a second institution's
 * mark would be resolved from configuration.
 *
 * The height travels as a custom property: the bar shrinks it on a phone, and that is a decision of
 * the bar, not of the mark.
 */
@Component({
  selector: 'app-brand-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      --brand-logo-height: 2.25rem;

      display: inline-flex;
    }

    img {
      display: block;
      block-size: var(--brand-logo-height);
      inline-size: auto;
      // The wordmark is crimson and teal ink with no light variant, so on dark surfaces it sits on
      // a plate instead of being recoloured.
      padding: var(--univgo-space-xs) var(--univgo-space-s);
      border-radius: var(--tui-radius-s);
      background: var(--univgo-logo-plate);
    }
  `,
  // The name of the product is not translated, so the alternative text is the mark itself.
  template: `<img src="images/UnivGo_logo.png" alt="UnivGo" width="1743" height="568" />`,
})
export class BrandLogo {}
