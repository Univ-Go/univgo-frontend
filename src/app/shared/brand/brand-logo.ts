import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BrandColors } from './brand-colors';

let nextInstanceId = 0;

/**
 * Level 1: the wordmark. The application bar, the footer and the sign-in panel all showed it, each
 * repeating the file, its intrinsic size and the plate it sits on. This is the one place that
 * knows which artwork the product is signed with — which is also the place a second institution's
 * mark would be resolved from configuration.
 *
 * The artwork is inlined rather than referenced through `<img>`: a referenced SVG is an isolated
 * document, so none of the page's custom properties reach it and the mark could not be recoloured.
 *
 * The height travels as a custom property: the bar shrinks it on a phone, and that is a decision of
 * the bar, not of the mark.
 */
@Component({
  selector: 'app-brand-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: BrandColors, inputs: ['colors'] }],
  // The name of the product is not translated, so the accessible name is the mark itself. The role
  // is on the host so the paths underneath are not announced one by one.
  host: { role: 'img', 'aria-label': 'UnivGo' },
  styles: `
    :host {
      --brand-logo-height: 2.25rem;

      display: inline-flex;
    }

    svg {
      display: block;
      block-size: var(--brand-logo-height);
      inline-size: auto;
      // The wordmark is crimson and teal ink, so on a surface it cannot sit on it takes a plate
      // rather than being recoloured. Callers that would rather recolour it can: that is what the
      // palette is for.
      padding: var(--univgo-space-xs) var(--univgo-space-s);
      border-radius: var(--tui-radius-s);
      background: var(--univgo-logo-plate);
    }
  `,
  templateUrl: './univgo-logo-full.svg',
})
export class BrandLogo {
  // The artwork's masks carry fixed ids. Two instances mounted at once — admin header + admin
  // aside, app header + app footer — would collide on the same id and corrupt one of the masks.
  protected readonly maskSuffix = `-${nextInstanceId++}`;
}
