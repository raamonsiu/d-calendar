import type { Habit, HabitFrequency } from '@/types';

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

/**
 * Frequency label exactly as it appears on the habit card.
 *
 * @param habit Habit to read the frequency and the target from.
 */
export function habitFrequencyLabel(
  habit: Pick<Habit, 'frequency' | 'target'>,
) {
  switch (habit.frequency) {
    case 'Diario':
      return 'DIARIO';
    case 'Semanal':
      return 'SEM.';
    case 'X por día':
      return `${habit.target}×/DÍA`;
    case 'X por semana':
      return `${habit.target}×/SEM`;
  }
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
