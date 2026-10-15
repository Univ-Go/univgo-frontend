import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TuiBadge, TuiSkeleton } from '@taiga-ui/kit';
import type { BlockLoad } from '../../domain/attendance';
import {
  fullnessBandOf,
  isDayOpen,
  type BlockPhase,
  type SpaceDaySummary,
} from '../../domain/block-schedule';
import { BlockStatusBadge } from '../block-status-badge/block-status-badge';

/**
 * Level 3: one day of the week picker, answering with the same number every block below answers
 * with — free spots — and the same icon-and-word badge, so there is one reading to learn rather than
 * a percentage here and a count there.
 *
 * A row of the week list, on every screen size: the picker sits above the day on a phone and beside
 * it on a wide screen, so its width stays close to a phone's either way.
 *
 * `summary` is `null` while the week's totals load, which is what the skeleton reads.
 */
@Component({
  selector: 'app-block-week-day',
  imports: [BlockStatusBadge, DatePipe, TuiBadge, TuiSkeleton],
  templateUrl: './block-week-day.html',
  styleUrl: './block-week-day.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockWeekDay {
  public readonly day = input.required<Date>();
  public readonly summary = input<SpaceDaySummary | null>(null);
  public readonly today = input(false);
  /** A day before today reads "Finalizado" instead of a band nobody can book into any more. */
  public readonly past = input(false);
  /** Whether the schedule below is showing this day. Paints the cell and sets `aria-pressed`. */
  public readonly viewing = input(false);
  public readonly loading = input(false);

  public readonly selected = output<void>();

  protected readonly open = computed(() => {
    const summary = this.summary();

    return summary !== null && isDayOpen(summary);
  });

  protected readonly freeSpots = computed(() => this.summary()?.totalFree ?? 0);

  /** A day that is over or closed has no seats to offer, so it shows no count at all. */
  protected readonly showsCount = computed(() => this.open() && !this.past());

  protected readonly phase = computed((): BlockPhase => (this.past() ? 'past' : 'upcoming'));

  protected readonly band = computed(() => {
    const capacity = this.summary()?.totalCapacity ?? 0;
    const free = this.freeSpots();
    const occupied = capacity - free;
    const load: BlockLoad = {
      capacity,
      occupied,
      free,
      ratio: capacity > 0 ? occupied / capacity : 0,
    };

    return fullnessBandOf(load);
  });
}
