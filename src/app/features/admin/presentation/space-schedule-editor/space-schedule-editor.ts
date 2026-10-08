import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { tuiExtractI18n } from '@taiga-ui/i18n';
import { TuiAccordion } from '@taiga-ui/kit';
import { formatTimeRange } from '../../../../shared/time/time-of-day';
import {
  type ScheduleWindowDraft,
  copyDayToWholeWeek,
  scheduleIssues,
  windowsOfDay,
} from '../../domain/space-draft';
import { WEEKDAYS, weekdayLabel } from '../../domain/weekday';
import type { ScheduleRow, ScheduleRowChange } from '../space-schedule-day/space-schedule-day';
import { SpaceScheduleDay } from '../space-schedule-day/space-schedule-day';

const MINUTES_PER_HOUR = 60;

const DEFAULT_WINDOW = { fromMinutes: 6 * MINUTES_PER_HOUR, toMinutes: 22 * MINUTES_PER_HOUR };

interface DaySection {
  readonly dayOfWeek: number;
  readonly name: string;
  readonly shortName: string;
  readonly summary: string;
  readonly rows: readonly ScheduleRow[];
  readonly invalid: boolean;
}

/**
 * Level 2: a space's week of opening hours, which is what the server slices into the blocks students
 * reserve.
 *
 * **The shape is the hard part.** Seven days by N windows is two-dimensional, and the product is
 * used on a phone. An accordion of seven rows answers the question an administrator actually asks —
 * "is Sunday set?" — in seven lines without opening anything, because each header carries the day
 * and a summary of its hours. A table would impose a column count on a structure that has none, and
 * its empty cells read as a bug.
 *
 * `closeOthers` is off: comparing two days means having both open.
 *
 * The weekday abbreviations come from Taiga's own `shortWeekDays`, which is already a Monday-first
 * seven-tuple in the build's language — the same `1..7` convention `space_schedules.day_of_week`
 * uses. Translating seven abbreviations by hand would be seven keys for something the library ships.
 */
@Component({
  selector: 'app-space-schedule-editor',
  imports: [SpaceScheduleDay, TuiAccordion],
  templateUrl: './space-schedule-editor.html',
  styleUrl: './space-schedule-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceScheduleEditor {
  public readonly value = model.required<readonly ScheduleWindowDraft[]>();
  public readonly disabled = input(false);

  /** Already in the build's language, and Monday-first, which is `day_of_week` 1. */
  private readonly shortWeekDays = tuiExtractI18n('shortWeekDays')();

  protected readonly sections = computed<readonly DaySection[]>(() => {
    const windows = this.value();
    const issues = scheduleIssues(windows);

    return WEEKDAYS.map((dayOfWeek) => {
      const rows = windows
        .map((window, index) => ({ window, index }))
        .filter((entry) => entry.window.dayOfWeek === dayOfWeek)
        .map(({ window, index }) => ({
          index,
          fromMinutes: window.fromMinutes,
          toMinutes: window.toMinutes,
          issue: issues.find((issue) => issue.index === index)?.kind ?? null,
        }));

      return {
        dayOfWeek,
        name: weekdayLabel(dayOfWeek),
        shortName: this.shortNameOf(dayOfWeek),
        summary: summaryOf(windows, dayOfWeek),
        rows,
        invalid: rows.some((row) => row.issue !== null),
      };
    });
  });

  protected addWindow(dayOfWeek: number): void {
    this.value.update((windows) => [...windows, { dayOfWeek, ...DEFAULT_WINDOW }]);
  }

  protected removeWindow(index: number): void {
    this.value.update((windows) => windows.filter((_, position) => position !== index));
  }

  protected changeWindow(change: ScheduleRowChange): void {
    this.value.update((windows) =>
      windows.map((window, position) =>
        position === change.index
          ? { ...window, fromMinutes: change.fromMinutes, toMinutes: change.toMinutes }
          : window,
      ),
    );
  }

  protected copyToWeek(dayOfWeek: number): void {
    this.value.update((windows) => copyDayToWholeWeek(windows, dayOfWeek));
  }

  private shortNameOf(dayOfWeek: number): string {
    return this.shortWeekDays()[dayOfWeek - 1] ?? weekdayLabel(dayOfWeek);
  }
}

function summaryOf(windows: readonly ScheduleWindowDraft[], dayOfWeek: number): string {
  const ofDay = windowsOfDay(windows, dayOfWeek);

  if (ofDay.length === 0) {
    return $localize`:@@admin.spaceSchedules.closed:Cerrado`;
  }

  return ofDay.map((window) => formatTimeRange(window.fromMinutes, window.toMinutes)).join(' · ');
}
