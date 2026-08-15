import { MS_PER_DAY, startOfDay, startOfWeek } from '@/lib/date';
import type { Language } from '@/lib/language';
import type { Habit, HabitFrequency, WeekStart } from '@/types';

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
 * Postcondition: midnight of that day for a daily habit, midnight of the
 * first day of the week for a weekly one, so two instants in the same period
 * always return the same number.
 *
 * @param frequency How often the habit repeats.
 * @param at Instant the period is looked for.
 * @param weekStart Week start preference, which decides where a week begins.
 */
export function habitPeriodStart(
  frequency: HabitFrequency,
  at: number,
  weekStart: WeekStart,
): number {
  const date = new Date(at);
  return isWeeklyFrequency(frequency)
    ? startOfWeek(date, weekStart).getTime()
    : startOfDay(date).getTime();
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
 * @param now Instant the current period is worked out from.
 */
export function rolledOverHabit(
  habit: Habit,
  weekStart: WeekStart,
  now: number = Date.now(),
): Habit {
  const current = habitPeriodStart(habit.frequency, now, weekStart);
  if (habit.periodStart === current) return habit;
  if (habit.periodStart === null) return { ...habit, periodStart: current };

  const previous = habitPeriodStart(habit.frequency, habit.periodStart, weekStart);
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
 * @param now Instant the current period is worked out from.
 */
export const rolledOverHabits = (
  habits: Habit[],
  weekStart: WeekStart,
  now: number = Date.now(),
) => habits.map((habit) => rolledOverHabit(habit, weekStart, now));
