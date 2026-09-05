import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BrandColors } from './brand-colors';

/**
 * Level 1: the mark without the wordmark, for the places too narrow for the full logo and for the
 * decorative uses the sign-in panel makes of it.
 *
 * Decorative throughout: everywhere it appears today the wordmark or a heading already names the
 * product, so announcing it again is noise. A use that needs it labelled needs a label of its own,
 * which is a reason to add an input then rather than an unused one now.
 */
@Component({
  selector: 'app-brand-isotype',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: BrandColors, inputs: ['colors'] }],
  host: { 'aria-hidden': 'true' },
  styles: `
    :host {
      --brand-isotype-size: 2.5rem;

      display: inline-flex;
      block-size: var(--brand-isotype-size);
    }

    svg {
      display: block;
      block-size: 100%;
      inline-size: auto;
    }
  `,
  templateUrl: './univgo-isotype.svg',
})
export class BrandIsotype {}
