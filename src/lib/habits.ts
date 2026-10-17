import {
  DAYS_PER_WEEK,
  MS_PER_DAY,
  addDays,
  parseClock,
  startOfDay,
  startOfWeek,
  weekStartIndex,
  type ClockTime,
} from '@/lib/date';
import type { Language } from '@/lib/language';
import type { Habit, HabitFrequency, WeekStart } from '@/types';

/** Midnight: the day-end every habit rolled over at before it became a setting. */
export const MIDNIGHT: ClockTime = { hour: 0, minute: 0 };

/**
 * The day-end preference as a time of day, from the "HH:MM" text it is stored
 * as.
 *
 * Postcondition: midnight when the text is missing or not a time of day, which
 * is what every habit rolled over at before the setting existed.
 *
 * @param time Stored `dayEndTime`, possibly missing or malformed.
 */
export const dayEndClock = (time: string | undefined): ClockTime =>
  parseClock(time ?? '') ?? MIDNIGHT;

/**
 * Whether an instant falls before a day-end, comparing local hour and minute
 * directly instead of an elapsed duration.
 *
 * Postcondition: always false for the default midnight day-end, since nothing
 * is ever earlier than 00:00.
 *
 * @param date Instant to place, read in local time.
 * @param dayEnd Hour and minute the day rolls over at.
 */
function isBeforeDayEnd(date: Date, dayEnd: ClockTime) {
  const hour = date.getHours();
  return hour < dayEnd.hour || (hour === dayEnd.hour && date.getMinutes() < dayEnd.minute);
}

/**
 * Habit rules: how progress moves forward, how the streak moves and how they
 * are labelled on the card. They are pure functions, kept apart from the store,
 * because this is the part that has to survive untouched once persistence is
 * real.
 */

/** Weekly habits count their streak in weeks, not in days. */
export const isWeeklyFrequency = (frequency: HabitFrequency) =>
  frequency === 'Semanal' || frequency === 'X por semana';

/** Frequencies that need a target greater than 1. */
export const isMultiFrequency = (frequency: HabitFrequency) =>
  frequency === 'X por día' || frequency === 'X por semana';

/** Abbreviated frequency label, one set per language. */
const FREQUENCY_LABELS: Record<
  Language,
  Record<HabitFrequency, (target: number) => string>
> = {
  es: {
    Diario: () => 'DIARIO',
    Semanal: () => 'SEM.',
    'X por día': (target) => `${target}×/DÍA`,
    'X por semana': (target) => `${target}×/SEM`,
  },
  en: {
    Diario: () => 'DAILY',
    Semanal: () => 'WK.',
    'X por día': (target) => `${target}×/DAY`,
    'X por semana': (target) => `${target}×/WK`,
  },
  ca: {
    Diario: () => 'DIARI',
    Semanal: () => 'SET.',
    'X por día': (target) => `${target}×/DIA`,
    'X por semana': (target) => `${target}×/SET`,
  },
};

/**
 * Frequency label exactly as it appears on the habit card.
 *
 * @param habit Habit to read the frequency and the target from.
 * @param language Active language.
 */
export function habitFrequencyLabel(
  habit: Pick<Habit, 'frequency' | 'target'>,
  language: Language,
) {
  return FREQUENCY_LABELS[language][habit.frequency](habit.target);
}

/** Unit of the streak: days or weeks. */
export const habitStreakUnit = (habit: Pick<Habit, 'frequency'>) =>
  isWeeklyFrequency(habit.frequency) ? 'S' : 'D';

/** true when the habit has every repetition of the period done. */
export const isHabitDone = (habit: Pick<Habit, 'progress' | 'target'>) =>
  habit.progress >= habit.target;

/**
 * Progress resulting from tapping the habit card.
 *
 * A tap adds a repetition; a long press subtracts one. Tapping while already
 * complete sends the counter back to 0, which is how a single-repetition habit
 * gets unmarked.
 *
 * Precondition: `target` is 1 or more and `progress` is between 0 and `target`.
 * Postcondition: the result is between 0 and `target`.
 *
 * @param progress Repetitions done so far.
 * @param target Repetitions needed in the period.
 * @param delta +1 on tap, -1 on long press.
 */
export function nextHabitProgress(
  progress: number,
  target: number,
  delta: 1 | -1,
) {
  if (delta === -1) return Math.max(0, progress - 1);
  if (progress >= target) return 0;
  return progress + 1;
}

/**
 * Streak resulting from a change in progress.
 *
 * The streak goes up when the habit is completed and down when that same
 * repetition is undone; any other move leaves it alone.
 *
 * Precondition: `streak` is 0 or more. Postcondition: the result is never
 * negative and moves by at most 1.
 *
 * @param streak Current streak.
 * @param wasDone Whether the habit was complete before the change.
 * @param isDone Whether it is complete after the change.
 */
export function nextHabitStreak(
  streak: number,
  wasDone: boolean,
  isDone: boolean,
) {
  if (isDone && !wasDone) return streak + 1;
  if (wasDone && !isDone) return Math.max(0, streak - 1);
  return streak;
}

/**
 * Start of the period a habit counts in, at the instant given.
 *
 * A day-end other than midnight shifts where that boundary falls without
 * changing its length: anything before that hour still belongs to the day (or
 * week) before it, exactly as anything before midnight would with the
 * default. The comparison and the final instant are both built from local
 * calendar fields rather than elapsed milliseconds, so a day-end of, say,
 * 04:00 still means 04:00 on a day a clock change makes 23 or 25 hours long.
 * Two instants in the same period always return the same number.
 *
 * @param frequency How often the habit repeats.
 * @param at Instant the period is looked for.
 * @param weekStart Week start preference, which decides where a week begins.
 * @param dayEnd Hour and minute the day - and with it every period - rolls
 * over at.
 */
export function habitPeriodStart(
  frequency: HabitFrequency,
  at: number,
  weekStart: WeekStart,
  dayEnd: ClockTime = MIDNIGHT,
): number {
  const date = new Date(at);
  const calendarDay = isBeforeDayEnd(date, dayEnd)
    ? addDays(startOfDay(date), -1)
    : startOfDay(date);
  const boundaryDay = isWeeklyFrequency(frequency)
    ? startOfWeek(calendarDay, weekStart)
    : calendarDay;
  return new Date(
    boundaryDay.getFullYear(),
    boundaryDay.getMonth(),
    boundaryDay.getDate(),
    dayEnd.hour,
    dayEnd.minute,
  ).getTime();
}

/**
 * How many days at the end of the week a weekly habit is chased on.
 *
 * A weekly habit can be done any day of the week, so being undone on a Tuesday
 * says nothing: the user may have done one of its N repetitions today, or plan
 * to do it later. Only the last days of the week are the point where an undone
 * one is really at risk, and those are the only days it is reported as pending
 * and reminded about.
 */
export const WEEK_CLOSING_DAYS = 2;

/**
 * Whether an instant falls on the closing days of its week: the last
 * `WEEK_CLOSING_DAYS` of the weekly period it belongs to.
 *
 * The week is the one a weekly habit counts in, so a day-end other than
 * midnight shifts the closing days with it, and the boundary is built from
 * calendar days so it stays right on a week that changes the clock.
 *
 * Postcondition: true on exactly `WEEK_CLOSING_DAYS` days of every week.
 *
 * @param now Instant to place.
 * @param weekStart Week start preference.
 * @param dayEnd Hour and minute the day rolls over at; defaults to midnight.
 */
export function isWeekClosing(
  now: number,
  weekStart: WeekStart,
  dayEnd: ClockTime = MIDNIGHT,
) {
  const weekStartAt = habitPeriodStart('Semanal', now, weekStart, dayEnd);
  const closingStart = addDays(
    new Date(weekStartAt),
    DAYS_PER_WEEK - WEEK_CLOSING_DAYS,
  ).getTime();
  return now >= closingStart;
}

/**
 * The closing days of the week as `getDay()` indexes, in the order they come.
 *
 * Postcondition: returns `WEEK_CLOSING_DAYS` indexes, the last of them the day
 * right before `weekStart`.
 *
 * @param weekStart Week start preference.
 */
export function weekClosingWeekdays(weekStart: WeekStart) {
  const first = weekStartIndex(weekStart);
  return Array.from(
    { length: WEEK_CLOSING_DAYS },
    (_, index) => (first + DAYS_PER_WEEK - WEEK_CLOSING_DAYS + index) % DAYS_PER_WEEK,
  );
}

/**
 * Whether a habit counts as still pending at an instant.
 *
 * A daily habit is pending while its day is not complete. A weekly one is
 * pending only on the closing days of its week (`isWeekClosing`): before
 * them, an incomplete week is simply a week still under way.
 *
 * Precondition: `habit` is already rolled over to the period containing `now`
 * (`rolledOverHabit`). Postcondition: always false for a complete habit.
 *
 * @param habit Habit to read.
 * @param weekStart Week start preference.
 * @param dayEnd Hour and minute the day rolls over at.
 * @param now Instant the question is asked at.
 */
export function isHabitPending(
  habit: Habit,
  weekStart: WeekStart,
  dayEnd: ClockTime,
  now: number,
) {
  if (isHabitDone(habit)) return false;
  if (!isWeeklyFrequency(habit.frequency)) return true;
  return isWeekClosing(now, weekStart, dayEnd);
}

/**
 * The habit as it stands in the period containing `now`.
 *
 * A habit carries the repetitions of one period only. When the period it was
 * last counted in is over, the count goes back to 0 - which is what makes it
 * tickable again the next day or the next week - and the streak survives only
 * if that period was completed and is the one immediately before this one:
 * a period finished half way, or a period skipped entirely, breaks it.
 *
 * Precondition: none; a habit that was never counted simply joins the current
 * period untouched. Postcondition: returns the same object when nothing
 * changes, so a list of habits can be mapped without every card re-rendering.
 *
 * @param habit Habit as it is stored.
 * @param weekStart Week start preference.
 * @param dayEnd Hour and minute the day rolls over at; defaults to midnight.
 * @param now Instant the current period is worked out from.
 */
export function rolledOverHabit(
  habit: Habit,
  weekStart: WeekStart,
  dayEnd: ClockTime = MIDNIGHT,
  now: number = Date.now(),
): Habit {
  const current = habitPeriodStart(habit.frequency, now, weekStart, dayEnd);
  if (habit.periodStart === current) return habit;
  if (habit.periodStart === null) return { ...habit, periodStart: current };

  const previous = habitPeriodStart(
    habit.frequency,
    habit.periodStart,
    weekStart,
    dayEnd,
  );
  const length = isWeeklyFrequency(habit.frequency)
    ? MS_PER_DAY * 7
    : MS_PER_DAY;

  /**
   * Whether the period just left is the one right before this one. The
   * comparison allows a day of slack because a week that crosses a daylight
   * saving change is an hour shorter or longer than seven exact days.
   */
  const consecutive = current - previous <= length + MS_PER_DAY;

  return {
    ...habit,
    progress: 0,
    streak: consecutive && isHabitDone(habit) ? habit.streak : 0,
    periodStart: current,
  };
}

/**
 * Every habit brought into the period containing `now`.
 *
 * Postcondition: returns a new list, but each habit that needed no rollover
 * is the very same object it was.
 *
 * @param habits Every habit in the store.
 * @param weekStart Week start preference.
 * @param dayEnd Hour and minute the day rolls over at; defaults to midnight.
 * @param now Instant the current period is worked out from.
 */
export const rolledOverHabits = (
  habits: Habit[],
  weekStart: WeekStart,
  dayEnd: ClockTime = MIDNIGHT,
  now: number = Date.now(),
) => habits.map((habit) => rolledOverHabit(habit, weekStart, dayEnd, now));
