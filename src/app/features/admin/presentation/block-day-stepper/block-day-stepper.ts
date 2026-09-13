import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TuiDay } from '@taiga-ui/cdk';
import { TuiButton, TuiCalendar, TuiDropdown } from '@taiga-ui/core';
import { addDays, isSameDay } from '../../../../shared/time/calendar-day';
import type { NavigableDayRange } from '../../domain/block-schedule';

let nextTriggerId = 0;

/**
 * Level 3: which day the schedule is showing. Two arrows for the step somebody takes nine times out
 * of ten — yesterday, tomorrow — and the date itself as a trigger for the jump that would otherwise
 * cost seven presses.
 *
 * The calendar is Taiga's own rather than a grid of buttons: `[min]` and `[max]` make the days
 * outside the configured window genuinely unreachable — disabled to a keyboard and to a screen
 * reader, not merely greyed — which is the part that is expensive to get right by hand.
 *
 * The arrows are disabled at the bounds rather than hidden. A control that disappears leaves no way
 * to tell "there is nothing further" from "the button moved".
 */
@Component({
  selector: 'app-block-day-stepper',
  imports: [DatePipe, TuiButton, TuiCalendar, TuiDropdown],
  templateUrl: './block-day-stepper.html',
  styleUrl: './block-day-stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockDayStepper {
  public readonly day = input.required<Date>();
  public readonly range = input.required<NavigableDayRange>();
  /** The instant "hoy" is measured against, passed in so the label cannot drift from the list. */
  public readonly now = input.required<Date>();

  public readonly daySelected = output<Date>();

  protected readonly triggerId = `day-stepper-trigger-${nextTriggerId++}`;
  protected readonly open = signal(false);
  protected readonly pickerLabel = $localize`:@@admin.blocks.day.label:Cambiar de día`;

  protected readonly previousDay = computed(() => addDays(this.day(), -1));
  protected readonly nextDay = computed(() => addDays(this.day(), 1));

  protected readonly atFirst = computed(
    () => this.previousDay().getTime() < this.range().from.getTime(),
  );

  protected readonly atLast = computed(() => this.nextDay().getTime() > this.range().to.getTime());

  protected readonly min = computed(() => TuiDay.fromLocalNativeDate(this.range().from));
  protected readonly max = computed(() => TuiDay.fromLocalNativeDate(this.range().to));
  protected readonly value = computed(() => TuiDay.fromLocalNativeDate(this.day()));

  /**
   * "Hoy" and the date are two independent pieces, never one interpolated sentence: `CLAUDE.md` §6
   * forbids building a phrase whose grammar depends on what is dropped into it. `null` for any other
   * day, which is also what makes the separator disappear with the word instead of leaving a comma
   * hanging in front of the date.
   */
  protected readonly relativeLabel = computed(() => {
    const day = this.day();
    const now = this.now();

    if (isSameDay(day, now)) {
      return $localize`:@@admin.blocks.day.today:Hoy`;
    }

    if (isSameDay(day, addDays(now, -1))) {
      return $localize`:@@admin.blocks.day.yesterday:Ayer`;
    }

    return isSameDay(day, addDays(now, 1)) ? $localize`:@@admin.blocks.day.tomorrow:Mañana` : null;
  });

  protected step(days: number): void {
    this.daySelected.emit(addDays(this.day(), days));
  }

  protected pick(day: TuiDay): void {
    this.open.set(false);
    this.daySelected.emit(day.toLocalNativeDate());
  }
}
