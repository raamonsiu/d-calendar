/**
 * Domain rules for tasks that do not belong in the store or a component.
 */
import { startOfDay } from './date';
import type { Task } from '@/types';

/**
 * Whether a completed task belongs to a day already gone.
 *
 * A task done with no `doneAt` counts as expired, and that is not a detail:
 * it is what an install that was already there before the field existed looks
 * like, and every task it had ticked off would otherwise stay for ever. The
 * two are written together by `toggleTask`, so from here on the only way to
 * be done without a timestamp is to come from one of those installs, which
 * means the day it happened is gone.
 *
 * Postcondition: false for anything not done, whatever `doneAt` holds.
 *
 * @param task Task being judged.
 * @param now Instant the midnight cutoff is computed from.
 */
export function isTaskExpired(task: Task, now: number): boolean {
  if (!task.done) return false;
  if (task.doneAt == null) return true;
  return task.doneAt < startOfDay(new Date(now)).getTime();
}

/**
 * Tasks kept after dropping the ones completed on an earlier day.
 *
 * Precondition: none. Postcondition: returns a new list; a task done earlier
 * today is kept regardless of the time, and one still not done is always
 * kept, whatever `doneAt` holds.
 *
 * @param tasks Every task in the store.
 * @param now Instant the midnight cutoff is computed from.
 */
export function withoutExpiredTasks(tasks: Task[], now: number): Task[] {
  return tasks.filter((task) => !isTaskExpired(task, now));
}
