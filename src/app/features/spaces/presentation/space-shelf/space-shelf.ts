import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiLink } from '@taiga-ui/core';
import { TUI_REDUCED_MOTION } from '@taiga-ui/core/tokens';
import type { ListedSpace, SpaceCategory } from '../../domain/space';
import { SpaceCard } from '../space-card/space-card';
import { spaceCategoryName } from '../space-category';

/** How much of the viewport one press of an arrow moves, leaving a card of overlap for context. */
const SCROLL_STEP = 0.8;

/**
 * Level 2: one category rail on the browse view.
 *
 * Not built on `tui-carousel`: that component keeps exactly three slides in the DOM at a time and
 * sizes each to the full viewport, which is right for a banner and cannot show four cards side by
 * side. A rail is a scroll container, so it is one here — every card stays in the DOM and in the tab
 * order, and the arrows only drive `scrollBy`.
 */
@Component({
  selector: 'app-space-shelf',
  imports: [RouterLink, SpaceCard, TuiButton, TuiLink],
  templateUrl: './space-shelf.html',
  styleUrl: './space-shelf.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:resize)': 'measure()' },
})
export class SpaceShelf {
  public readonly category = input.required<SpaceCategory>();
  public readonly spaces = input.required<readonly ListedSpace[]>();
  /** Spaces in the category, including those beyond the rail — this is what "Ver todos" opens. */
  public readonly total = input.required<number>();

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  private readonly behavior: ScrollBehavior = inject(TUI_REDUCED_MOTION) ? 'auto' : 'smooth';

  protected readonly atStart = signal(true);
  protected readonly atEnd = signal(true);

  /** Nothing to page through when the rail already fits, so the arrows stay out of the way. */
  protected readonly scrollable = computed(() => !this.atStart() || !this.atEnd());

  protected readonly name = computed(() => spaceCategoryName(this.category()));

  /**
   * Three identical "Ver todos" links on one page tell a screen reader nothing about where each
   * goes. The category rides in its own placeholder rather than inside a sentence, so no
   * translation has to agree with it.
   */
  protected readonly viewAllLabel = computed(
    () => $localize`:@@spaces.shelf.viewAllLabel:Ver todos: ${this.name()}:category:`,
  );

  constructor() {
    afterNextRender(() => this.measure());
  }

  protected measure(): void {
    const element = this.track().nativeElement;
    const furthest = element.scrollWidth - element.clientWidth;

    this.atStart.set(element.scrollLeft <= 1);
    this.atEnd.set(element.scrollLeft >= furthest - 1);
  }

  protected page(direction: 1 | -1): void {
    const element = this.track().nativeElement;

    element.scrollBy({
      left: direction * element.clientWidth * SCROLL_STEP,
      behavior: this.behavior,
    });
  }
}
