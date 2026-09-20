import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import type { TuiSizeL, TuiSizeS } from '@taiga-ui/core/types';
import type { SpaceAvailability } from '../../domain/space';

/**
 * Level 2: the one action the catalogue offers for a space, wherever it is offered — the card in
 * the shelves and the grid, and the space's own page. What it says depends on the availability the
 * catalogue resolved, and that mapping is the part worth having in one place: a card that reads
 * "Reservar" next to a page that reads "No disponible" for the same space would be the kind of
 * disagreement nobody notices until a student does.
 *
 * Nothing free today is not nothing to offer: the schedule step is where the other days are, so
 * that case goes to the same place "Reservar" does and only promises less. A space that is shut is
 * the one state with nowhere to send anybody, so it is a disabled button and not a link.
 */
@Component({
  selector: 'app-space-book-action',
  imports: [RouterLink, TuiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
    }

    a,
    button {
      inline-size: 100%;
    }
  `,
  template: `
    @if (bookable()) {
      <a
        tuiButton
        [routerLink]="['/book', spaceId(), 'when']"
        [size]="size()"
        appearance="primary"
        iconEnd="@tui.arrow-right"
        i18n="@@spaces.card.book"
      >
        Reservar
      </a>
    } @else if (closed()) {
      <button
        tuiButton
        type="button"
        [size]="size()"
        appearance="outline"
        disabled
        i18n="@@spaces.card.unavailable"
      >
        No disponible
      </button>
    } @else {
      <a
        tuiButton
        [routerLink]="['/book', spaceId(), 'when']"
        [size]="size()"
        appearance="outline"
        iconStart="@tui.calendar-search"
        i18n="@@spaces.card.viewSchedule"
      >
        Ver horarios
      </a>
    }
  `,
})
export class SpaceBookAction {
  public readonly spaceId = input.required<string>();
  public readonly availability = input.required<SpaceAvailability>();
  public readonly size = input<TuiSizeS | TuiSizeL>('m');

  protected readonly bookable = computed(() => this.availability().kind === 'free');

  protected readonly closed = computed(() => this.availability().kind === 'closed');
}
