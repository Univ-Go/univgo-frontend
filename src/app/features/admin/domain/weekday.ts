/**
 * Weekdays as the server numbers them: 1 is Monday and 7 is Sunday, matching
 * `space_schedules.day_of_week`. The same convention Taiga's own `shortWeekDays` uses, which is why
 * the compact labels in the editor come from the library instead of from our own translations.
 */
export const WEEKDAYS: readonly number[] = [1, 2, 3, 4, 5, 6, 7];

/**
 * The full name of a weekday, for the places a three-letter abbreviation is not enough — an
 * accessible name, or a screen wide enough to spell it out. Taiga publishes the short forms but not
 * these.
 */
export function weekdayLabel(dayOfWeek: number): string {
  switch (dayOfWeek) {
    case 1:
      return $localize`:@@weekday.monday:Lunes`;
    case 2:
      return $localize`:@@weekday.tuesday:Martes`;
    case 3:
      return $localize`:@@weekday.wednesday:Miércoles`;
    case 4:
      return $localize`:@@weekday.thursday:Jueves`;
    case 5:
      return $localize`:@@weekday.friday:Viernes`;
    case 6:
      return $localize`:@@weekday.saturday:Sábado`;
    default:
      return $localize`:@@weekday.sunday:Domingo`;
  }
}
