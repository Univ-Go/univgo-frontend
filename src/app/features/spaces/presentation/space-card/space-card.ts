import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiAppearance, TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { BookingDraftStore } from '../../../booking/application/booking-draft.store';
import type { ListedSpace } from '../../domain/space';
import { spaceCategoryIcon } from '../space-category';
import { SpaceAvailabilityBadge } from '../space-availability-badge/space-availability-badge';

/**
 * Level 2: the catalogue renders the same summary in the browse shelves and in the results grid, so
 * the card is one component used at one size in both — a second, smaller variant would be a second
 * card design to keep in step with this one.
 *
 * The card is also what tells the catalogue apart from step one of the booking flow, and it does so
 * without the catalogue knowing: the draft store is provided by the `/book` route, so injecting it
 * optionally answers "am I inside the flow?". Outside it, booking is a link that leaves for the
 * schedule step. Inside it, the same button marks the card instead, and the flow's own bar is what
 * moves forward — so a person can compare two spaces without losing the one they had picked.
 */
@Component({
  selector: 'app-space-card',
  imports: [
    RouterLink,
    SpaceAvailabilityBadge,
    TuiAppearance,
    TuiButton,
    TuiCardLarge,
    TuiIcon,
    TuiSurface,
  ],
  templateUrl: './space-card.html',
  styleUrl: './space-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceCard {
  public readonly listed = input.required<ListedSpace>();

  private readonly draft = inject(BookingDraftStore, { optional: true });

  protected readonly choosing = this.draft !== null;

  protected readonly chosen = computed(
    () => this.draft?.isSelected(this.listed().space.id) ?? false,
  );

  protected readonly chooseLabel = $localize`:@@spaces.card.choose:Elegir`;
  protected readonly chosenLabel = $localize`:@@spaces.card.chosen:Elegido`;

  protected readonly icon = computed(() => spaceCategoryIcon(this.listed().space.category));

  protected readonly bookable = computed(() => this.listed().availability.kind === 'free');

  protected readonly closed = computed(() => this.listed().availability.kind === 'maintenance');

  protected choose(): void {
    this.draft?.selectSpace(this.listed().space);
  }
}
