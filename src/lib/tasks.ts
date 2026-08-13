/**
 * Domain rules for tasks that do not belong in the store or a component.
 */
import { startOfDay } from './date';
import type { Task } from '@/types';

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
  const cutoff = startOfDay(new Date(now)).getTime();
  return tasks.filter((task) => task.doneAt == null || task.doneAt >= cutoff);
}
