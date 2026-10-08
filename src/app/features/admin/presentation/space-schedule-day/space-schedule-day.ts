import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TuiButton, TuiError } from '@taiga-ui/core';
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
 *
 * The hour fields are a plain native `<input type="time">` rather than Taiga's `tuiInputTime` or
 * `tuiSelect`: mounting either inside this row — with or without a dropdown, with or without
 * `tui-expand` around it — reliably freezes the tab and crashes the renderer with an out-of-memory
 * error the first time the control appears. Verified live, repeatedly, bisecting down to this one
 * element; not a guess. The native control needs no library wiring, so it sidesteps whatever in
 * Taiga's textfield/dropdown machinery is cycling. Revisit once the Taiga UI bug is understood or a
 * newer release fixes it — the project is several minors behind (§21).
 */
@Component({
  selector: 'app-space-schedule-day',
  imports: [TuiButton, TuiError],
  templateUrl: './space-schedule-day.html',
  styleUrl: './space-schedule-day.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceScheduleDay {
  public readonly dayName = input.required<string>();
  public readonly rows = input.required<readonly ScheduleRow[]>();
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

  /** `<input type="time">`'s own value format. */
  protected timeOf(minutes: number): string {
    const hours = Math.floor(minutes / MINUTES_PER_HOUR);
    const rest = minutes % MINUTES_PER_HOUR;

    return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
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

  protected changeFrom(row: ScheduleRow, value: string): void {
    const minutes = this.parse(value);

    if (minutes === null) {
      return;
    }

    this.windowChanged.emit({ index: row.index, fromMinutes: minutes, toMinutes: row.toMinutes });
  }

  protected changeTo(row: ScheduleRow, value: string): void {
    const minutes = this.parse(value);

    if (minutes === null) {
      return;
    }

    this.windowChanged.emit({ index: row.index, fromMinutes: row.fromMinutes, toMinutes: minutes });
  }

  /** Empty while the field is mid-edit; a browser never sends a malformed non-empty `HH:MM`. */
  private parse(value: string): number | null {
    if (!value) {
      return null;
    }

    const [hours, minutes] = value.split(':').map(Number);

    return hours * MINUTES_PER_HOUR + minutes;
  }
}
