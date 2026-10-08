import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiTime } from '@taiga-ui/cdk';
import { TuiButton, TuiDataList, TuiError } from '@taiga-ui/core';
import { TuiInputTime } from '@taiga-ui/kit';
import type { ScheduleIssueKind } from '../../domain/space-draft';

/** One row of the editor: a window of the day, its position in the whole week, and what is wrong. */
export interface ScheduleRow {
  readonly index: number;
  readonly fromMinutes: number;
  readonly toMinutes: number;
  readonly issue: ScheduleIssueKind | null;
}

export interface ScheduleRowChange {
  readonly index: number;
  readonly fromMinutes: number;
  readonly toMinutes: number;
}

const MINUTES_PER_HOUR = 60;

let nextDayId = 0;

/**
 * Level 3: one weekday's opening windows.
 *
 * Componentised because the editor repeats it seven times, which is the case §4 of `CLAUDE.md` calls
 * repetition within a view, and because it is where the only inline field errors in the panel live.
 */
@Component({
  selector: 'app-space-schedule-day',
  imports: [FormsModule, TuiButton, TuiDataList, TuiError, TuiInputTime],
  templateUrl: './space-schedule-day.html',
  styleUrl: './space-schedule-day.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceScheduleDay {
  public readonly dayName = input.required<string>();
  public readonly rows = input.required<readonly ScheduleRow[]>();
  public readonly timeOptions = input.required<readonly TuiTime[]>();
  public readonly disabled = input(false);
  public readonly copyable = input(false);

  public readonly windowAdded = output<void>();
  public readonly windowRemoved = output<number>();
  public readonly windowChanged = output<ScheduleRowChange>();
  public readonly copiedToWeek = output<void>();

  private readonly dayId = `schedule-day-${nextDayId++}`;

  protected readonly endBeforeStartMessage = $localize`:@@admin.spaceSchedules.endBeforeStart:La hora de cierre tiene que ser posterior a la de apertura.`;
  protected readonly duplicateMessage = $localize`:@@admin.spaceSchedules.duplicate:Esta franja está repetida en el mismo día.`;
  protected readonly overlapMessage = $localize`:@@admin.spaceSchedules.overlap:Esta franja se solapa con otra del mismo día. Dos franjas que comparten horas duplicarían los bloques.`;

  protected readonly hasRows = computed(() => this.rows().length > 0);

  protected fromId(index: number): string {
    return `${this.dayId}-from-${index}`;
  }

  protected toId(index: number): string {
    return `${this.dayId}-to-${index}`;
  }

  protected timeOf(minutes: number): TuiTime {
    return new TuiTime(Math.floor(minutes / MINUTES_PER_HOUR), minutes % MINUTES_PER_HOUR);
  }

  /** `TuiTime` has no `equals`, and two instances for the same hour are never `===`. */
  protected isSelected(option: TuiTime, minutes: number): boolean {
    return option.hours * MINUTES_PER_HOUR + option.minutes === minutes;
  }

  protected messageFor(issue: ScheduleIssueKind): string {
    switch (issue) {
      case 'endBeforeStart':
        return this.endBeforeStartMessage;
      case 'duplicate':
        return this.duplicateMessage;
      default:
        return this.overlapMessage;
    }
  }

  protected changeFrom(row: ScheduleRow, time: TuiTime | null): void {
    if (!time) {
      return;
    }

    this.windowChanged.emit({
      index: row.index,
      fromMinutes: time.hours * MINUTES_PER_HOUR + time.minutes,
      toMinutes: row.toMinutes,
    });
  }

  protected changeTo(row: ScheduleRow, time: TuiTime | null): void {
    if (!time) {
      return;
    }

    this.windowChanged.emit({
      index: row.index,
      fromMinutes: row.fromMinutes,
      toMinutes: time.hours * MINUTES_PER_HOUR + time.minutes,
    });
  }
}
