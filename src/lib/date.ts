/**
 * Dates of the app. Everything is computed in local time with the native
 * `Date`: there is no i18n dependency because the design is Spanish only.
 */
import type { WeekStart } from '@/theme/prefs';

export const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const MONTHS_LOWER = MONTHS.map((month) => month.toLowerCase());

const WEEKDAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

/** Initials from the design, indexed by `getDay()` (0 = Sunday). */
const WEEKDAY_INITIALS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

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
 */
export const weekdayInitial = (date: Date) => WEEKDAY_INITIALS[date.getDay()];

/**
 * The seven initials in the order the grids draw them.
 *
 * Precondition: `weekStart` is one of the three options in Settings.
 * Postcondition: always returns seven initials, starting with the one of the
 * first day of the week according to the preference.
 *
 * @param weekStart Week start preference.
 */
export function weekdayInitials(weekStart: WeekStart) {
  const first = weekStartIndex(weekStart);
  return Array.from(
    { length: DAYS_PER_WEEK },
    (_, offset) => WEEKDAY_INITIALS[(first + offset) % DAYS_PER_WEEK],
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
export const formatLongDate = (date: Date) =>
  `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS_LOWER[date.getMonth()]}`;

/** "Miércoles 30" - the Home title in day mode. */
export const formatDayTitle = (date: Date) =>
  `${WEEKDAYS[date.getDay()]} ${date.getDate()}`;

/** "30 JUL" */
export const formatShortDate = (date: Date) =>
  `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3).toUpperCase()}`;

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

/**
 * Age in the uppercase format of the side menu: "HACE 4 MIN".
 *
 * Precondition: `timestamp` is an instant in ms, or `null` when it never
 * happened. Postcondition: returns "NUNCA" without a timestamp, "AHORA" below
 * one minute, and from there on the largest unit that reaches 1.
 *
 * @param timestamp Instant to compare against now, or null.
 */
export function formatAgo(timestamp: number | null) {
  if (!timestamp) return 'NUNCA';

  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'AHORA';
  if (minutes < 60) return `HACE ${minutes} MIN`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `HACE ${hours} H`;

  return `HACE ${Math.floor(hours / 24)} D`;
}
