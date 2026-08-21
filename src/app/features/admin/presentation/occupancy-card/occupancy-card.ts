import { DecimalPipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TuiAppearance } from '@taiga-ui/core';
import { TuiProgressBar } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import type { BlockOccupancy } from '../../domain/attendance';

/**
 * Level 3: how full the block is. The panel's first question — "is there room?" — answered as the
 * two numbers it actually decomposes into, plus the meter that makes the ratio readable at a glance
 * from behind a desk.
 *
 * Free seats are shown in the palette's "available" teal and taken ones in the brand crimson, but
 * each still carries its own word: the pair has to read for someone who cannot tell the two hues
 * apart.
 */
@Component({
  selector: 'app-occupancy-card',
  imports: [DecimalPipe, PercentPipe, TuiAppearance, TuiCardLarge, TuiProgressBar, TuiSurface],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }

    .occupancy {
      display: flex;
      flex-direction: column;
      gap: var(--univgo-space-l);
      block-size: 100%;
    }

    .occupancy__heading {
      font: var(--tui-typography-heading-h6);
    }

    .occupancy__lead {
      margin: 0;
      color: var(--tui-text-tertiary);
      font: var(--tui-typography-ui-xs);
    }

    .counts {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: var(--univgo-space-l);
      margin: 0;
    }

    // The value reads before its label, which is the opposite of the source order a definition list
    // needs: the term has to come first in the markup for the pairing to survive without styles.
    .count {
      display: flex;
      flex-direction: column-reverse;
      min-inline-size: 0;
    }

    .count__label {
      color: var(--tui-text-tertiary);
      font: var(--tui-typography-ui-xs);
    }

    .count__value {
      margin: 0;
      font: var(--tui-typography-heading-h3);
      font-variant-numeric: tabular-nums;
      letter-spacing: var(--univgo-letter-spacing-tight);
    }

    .count--occupied .count__value {
      color: var(--tui-background-accent-1);
    }

    .count--free .count__value {
      color: var(--tui-text-positive);
    }

    .counts__divider {
      align-self: stretch;
      inline-size: 1px;
      background: var(--tui-border-normal);
    }

    .occupancy__meter {
      display: block;
      inline-size: 100%;
    }

    .occupancy__rate {
      margin: 0;
      color: var(--tui-text-secondary);
      font: var(--tui-typography-ui-xs);
    }
  `,
  template: `
    <article tuiCardLarge tuiSurface tuiAppearance="outline" class="occupancy">
      <header>
        <h2 class="occupancy__heading" i18n="@@admin.capacity.occupancy.title">Aforo total</h2>
        <p class="occupancy__lead" i18n="@@admin.capacity.occupancy.lead">
          Capacidad máxima permitida
        </p>
      </header>

      <dl class="counts">
        <div class="count count--occupied">
          <dt class="count__label" i18n="@@admin.capacity.occupancy.occupied">Ocupadas</dt>
          <dd class="count__value">{{ occupancy().occupied | number: '2.0-0' }}</dd>
        </div>

        <div class="counts__divider" aria-hidden="true"></div>

        <div class="count count--free">
          <dt class="count__label" i18n="@@admin.capacity.occupancy.free">
            Libres (de {{ occupancy().capacity }})
          </dt>
          <dd class="count__value">{{ occupancy().free | number: '2.0-0' }}</dd>
        </div>
      </dl>

      <!-- The rate below is the same number in words, so the meter itself adds nothing for a screen
           reader and is hidden from it rather than read out twice. -->
      <progress
        tuiProgressBar
        size="m"
        class="occupancy__meter"
        aria-hidden="true"
        [value]="occupancy().ratio"
        [max]="1"
      ></progress>

      <p class="occupancy__rate" i18n="@@admin.capacity.occupancy.rate">
        {{ occupancy().ratio | percent }} de ocupación
      </p>
    </article>
  `,
})
export class OccupancyCard {
  public readonly occupancy = input.required<BlockOccupancy>();
}
