/**
 * Dates of the app. Everything is computed in local time with the native
 * `Date`. The month/weekday names are the one part that depends on the
 * language, so every function that names one takes it as a plain parameter
 * instead of reading a preference itself: this stays a pure module, callable
 * from a test with no provider running.
 */
import { MONTH_LABELS, WEEKDAY_INITIALS, WEEKDAY_LABELS } from '@/data/translations/domain';
import type { Language, WeekStart } from '@/theme/prefs';

/** The twelve month names in the active language, `getMonth()` indexed. */
export const monthNames = (language: Language) => MONTH_LABELS[language];

/** One month name in the active language. */
export const monthName = (monthIndex: number, language: Language) =>
  MONTH_LABELS[language][monthIndex];

/** A day in milliseconds, for the offset arithmetic. */
export const MS_PER_DAY = 86400000;

/** Hours a day is drawn with: all of them, from 00 to 23. */
export const HOURS_PER_DAY = 24;

const DAYS_PER_WEEK = 7;

/**
 * Translates the week start preference into a `getDay()` index.
 *
 * Precondition: `weekStart` is one of the three options in Settings.
 * Postcondition: returns 1 (Monday), 6 (Saturday) or 0 (Sunday).
 *
 * @param weekStart Week start preference.
 */
export function weekStartIndex(weekStart: WeekStart) {
  if (weekStart === 'Lunes') return 1;
  if (weekStart === 'Sábado') return 6;
  return 0;
}

/**
 * Initial of the weekday a date falls on.
 *
 * @param date Date to take the initial from.
 * @param language Active language.
 */
export const weekdayInitial = (date: Date, language: Language) =>
  WEEKDAY_INITIALS[language][date.getDay()];

/**
 * The seven initials in the order the grids draw them.
 *
 * Precondition: `weekStart` is one of the three options in Settings.
 * Postcondition: always returns seven initials, starting with the one of the
 * first day of the week according to the preference.
 *
 * @param weekStart Week start preference.
 * @param language Active language.
 */
export function weekdayInitials(weekStart: WeekStart, language: Language) {
  const first = weekStartIndex(weekStart);
  const initials = WEEKDAY_INITIALS[language];
  return Array.from(
    { length: DAYS_PER_WEEK },
    (_, offset) => initials[(first + offset) % DAYS_PER_WEEK],
  );
}

/** Midnight of the day of `date`, without touching the original date. */
export const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * Adds days to a date.
 *
 * Postcondition: returns a new date; `date` is not modified. Month and year
 * rollovers are handled by `Date` (setDate accepts out-of-range values).
 *
 * @param date Starting date.
 * @param days Days to add; may be negative.
 */
export function addDays(date: Date, days: number) {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

/**
 * Jumps between months landing on day 1, which is what the grids need.
 *
 * Postcondition: returns day 1 of the resulting month, at midnight.
 *
 * @param date Starting date.
 * @param months Months to add; may be negative.
 */
export const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

/** true when both dates fall on the same day of the same month and year. */
export const isSameDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

export const isToday = (date: Date) => isSameDay(date, new Date());

/**
 * First day of the week containing `date`.
 *
 * Postcondition: returns a date at midnight whose `getDay()` is
 * `weekStartIndex(weekStart)` and which is never later than `date`.
 *
 * @param date Any day of the week being looked for.
 * @param weekStart Week start preference.
 */
function startOfWeek(date: Date, weekStart: WeekStart) {
  const first = weekStartIndex(weekStart);
  const offset = (date.getDay() - first + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  return addDays(startOfDay(date), -offset);
}

/**
 * The seven days of the week containing `date`, in drawing order.
 *
 * @param date Any day of the week being looked for.
 * @param weekStart Week start preference.
 */
export function weekDays(date: Date, weekStart: WeekStart) {
  const first = startOfWeek(date, weekStart);
  return Array.from({ length: DAYS_PER_WEEK }, (_, offset) =>
    addDays(first, offset),
  );
}

/**
 * ISO 8601 week number.
 *
 * It is computed in UTC and shifted to the Thursday of the week, which is the
 * definition in the standard: week 1 is the one containing the first Thursday
 * of the year.
 *
 * Postcondition: returns an integer between 1 and 53.
 *
 * @param date Day to get the week of.
 */
export function isoWeek(date: Date) {
  const thursday = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  thursday.setUTCDate(
    thursday.getUTCDate() + 4 - (thursday.getUTCDay() || DAYS_PER_WEEK),
  );
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const daysIntoYear = (thursday.getTime() - yearStart.getTime()) / MS_PER_DAY;
  return Math.ceil((daysIntoYear + 1) / DAYS_PER_WEEK);
}

/**
 * Cells of a month for a seven column grid.
 *
 * Precondition: `month` is a `getMonth()` index (0 = January). Postcondition:
 * returns `null` for the gaps before day 1 and one date per day of the month.
 * Trailing gaps are not filled in: `monthRows` takes care of that, because the
 * picker grid leaves them empty.
 *
 * @param year Four digit year.
 * @param month Month index, 0-11.
 * @param weekStart Week start preference.
 */
function monthCells(
  year: number,
  month: number,
  weekStart: WeekStart,
): (Date | null)[] {
  const firstOfMonth = new Date(year, month, 1);
  const leadingGaps =
    (firstOfMonth.getDay() - weekStartIndex(weekStart) + DAYS_PER_WEEK) %
    DAYS_PER_WEEK;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = Array.from({ length: leadingGaps }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  return cells;
}

/**
 * The same cells as `monthCells`, split into rows of seven.
 *
 * Postcondition: every row has exactly seven slots; the last one is padded with
 * `null`.
 *
 * @param year Four digit year.
 * @param month Month index, 0-11.
 * @param weekStart Week start preference.
 */
export function monthRows(
  year: number,
  month: number,
  weekStart: WeekStart,
): (Date | null)[][] {
  const cells = monthCells(year, month, weekStart);
  const rows: (Date | null)[][] = [];

  for (let start = 0; start < cells.length; start += DAYS_PER_WEEK) {
    const row = cells.slice(start, start + DAYS_PER_WEEK);
    while (row.length < DAYS_PER_WEEK) row.push(null);
    rows.push(row);
  }
  return rows;
}

const padded = (value: number) => String(value).padStart(2, '0');

/** "09:30" */
export const formatTime = (date: Date) =>
  `${padded(date.getHours())}:${padded(date.getMinutes())}`;

/**
 * Hour of the day as a decimal, which is the unit events are positioned with on
 * the hour rails: 09:30 -> 9.5
 */
export const decimalHours = (date: Date) =>
  date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

/** "Miércoles 30 julio" */
export const formatLongDate = (date: Date, language: Language) =>
  `${WEEKDAY_LABELS[language][date.getDay()]} ${date.getDate()} ${MONTH_LABELS[language][date.getMonth()].toLowerCase()}`;

/** "Miércoles 30" - the Home title in day mode. */
export const formatDayTitle = (date: Date, language: Language) =>
  `${WEEKDAY_LABELS[language][date.getDay()]} ${date.getDate()}`;

/** "30 JUL" */
export const formatShortDate = (date: Date, language: Language) =>
  `${date.getDate()} ${MONTH_LABELS[language][date.getMonth()].slice(0, 3).toUpperCase()}`;

/** Stable key for a day, used to group events by date. */
export const dayKey = (date: Date) =>
  `${date.getFullYear()}-${padded(date.getMonth() + 1)}-${padded(date.getDate())}`;

/**
 * Combines the day of one date with the time of another.
 *
 * Postcondition: returns a new date with the year, month and day of `day`, the
 * hours and minutes of `time`, and seconds at 0.
 *
 * @param day Date the day is taken from.
 * @param time Date the time is taken from.
 */
export function withTime(day: Date, time: Date) {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    time.getHours(),
    time.getMinutes(),
    0,
    0,
  );
}

/** Pieces `formatAgo` composes, one set per language. */
const AGO_LABELS: Record<
  Language,
  {
    never: string;
    now: string;
    minutesAgo: (minutes: number) => string;
    hoursAgo: (hours: number) => string;
    daysAgo: (days: number) => string;
  }
> = {
  es: {
    never: 'NUNCA',
    now: 'AHORA',
    minutesAgo: (minutes) => `HACE ${minutes} MIN`,
    hoursAgo: (hours) => `HACE ${hours} H`,
    daysAgo: (days) => `HACE ${days} D`,
  },
  en: {
    never: 'NEVER',
    now: 'NOW',
    minutesAgo: (minutes) => `${minutes} MIN AGO`,
    hoursAgo: (hours) => `${hours} H AGO`,
    daysAgo: (days) => `${days} D AGO`,
  },
  ca: {
    never: 'MAI',
    now: 'ARA',
    minutesAgo: (minutes) => `FA ${minutes} MIN`,
    hoursAgo: (hours) => `FA ${hours} H`,
    daysAgo: (days) => `FA ${days} D`,
  },
};

/**
 * Age in the uppercase format of the side menu: "HACE 4 MIN".
 *
 * Precondition: `timestamp` is an instant in ms, or `null` when it never
 * happened. Postcondition: returns the "never" label without a timestamp, the
 * "now" label below one minute, and from there on the largest unit that
 * reaches 1.
 *
 * @param timestamp Instant to compare against now, or null.
 * @param language Active language.
 */
export function formatAgo(timestamp: number | null, language: Language) {
  const labels = AGO_LABELS[language];
  if (!timestamp) return labels.never;

  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return labels.now;
  if (minutes < 60) return labels.minutesAgo(minutes);

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return labels.hoursAgo(hours);

  return labels.daysAgo(Math.floor(hours / 24));
}
