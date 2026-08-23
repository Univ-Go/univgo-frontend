/**
 * The seven weekday toggles a recurring closure picks from, Monday-first because that is how the
 * week reads here, not how `Date#getDay()` numbers it (`0` Sunday … `6` Saturday). Each option
 * carries a `referenceDate` — an arbitrary date that happens to fall on that weekday — instead of a
 * translated label: `date:'EEE'`/`'EEEE'` on it is how the weekday's name is spelled, the same
 * convention `BookingSlotPicker` already uses for its day strip. A Spanish and an English build read
 * "lun"/"Mon" straight off Angular's locale data, with no second translation to keep in step by hand.
 */
export interface WeekdayOption {
  readonly value: number;
  readonly referenceDate: Date;
}

const MONDAY_FIRST: readonly number[] = [1, 2, 3, 4, 5, 6, 0];

export const WEEKDAY_OPTIONS: readonly WeekdayOption[] = MONDAY_FIRST.map((value, index) => ({
  value,
  // 2024-01-01 was a Monday, so `+ index` walks Monday through the following Sunday.
  referenceDate: new Date(2024, 0, 1 + index),
}));

function capitalize(word: string): string {
  return word.length === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1);
}

/** Comma-separated weekday names, in the order the closure was scheduled — not calendar order,
 *  since "martes y jueves" is how an administrator would say the pattern back. */
export function weekdayListName(weekdays: readonly number[], locale: string): string {
  return weekdays
    .map((value) => WEEKDAY_OPTIONS.find((option) => option.value === value))
    .filter((option): option is WeekdayOption => option !== undefined)
    .map((option) => capitalize(formatWeekday(option.referenceDate, locale)))
    .join(', ');
}

function formatWeekday(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
}
