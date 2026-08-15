import type { Task } from '@/types';
import { withoutExpiredTasks } from './tasks';

const NOW = new Date(2026, 7, 13, 9, 0).getTime();
const TODAY_MIDNIGHT = new Date(2026, 7, 13, 0, 0).getTime();
const YESTERDAY_EVENING = new Date(2026, 7, 12, 22, 0).getTime();
const EARLIER_TODAY = new Date(2026, 7, 13, 7, 0).getTime();

/** Minimal task, so each test only sets what it actually varies. */
function task(fields: Partial<Task> & { id: string }): Task {
  return {
    title: 'Tarea',
    description: '',
    calendarId: 'cal-tareas',
    dueAt: null,
    hasTime: false,
    vagueMonth: null,
    done: false,
    doneAt: null,
    reminders: [],
    ...fields,
  };
}

describe('withoutExpiredTasks', () => {
  test('una tarea no marcada se conserva aunque no tenga doneAt', () => {
    const pending = task({ id: 'a' });
    expect(withoutExpiredTasks([pending], NOW)).toEqual([pending]);
  });

  test('una tarea completada hoy se conserva', () => {
    const doneToday = task({ id: 'a', done: true, doneAt: EARLIER_TODAY });
    expect(withoutExpiredTasks([doneToday], NOW)).toEqual([doneToday]);
  });

  test('una tarea completada justo a medianoche de hoy se conserva', () => {
    const doneAtMidnight = task({
      id: 'a',
      done: true,
      doneAt: TODAY_MIDNIGHT,
    });
    expect(withoutExpiredTasks([doneAtMidnight], NOW)).toEqual([
      doneAtMidnight,
    ]);
  });

  test('una tarea completada ayer desaparece', () => {
    const doneYesterday = task({
      id: 'a',
      done: true,
      doneAt: YESTERDAY_EVENING,
    });
    expect(withoutExpiredTasks([doneYesterday], NOW)).toEqual([]);
  });

  test('una tarea marcada en una version anterior, sin doneAt, desaparece', () => {
    const legacy = task({ id: 'a', done: true });
    delete (legacy as Partial<Task>).doneAt;

    expect(withoutExpiredTasks([legacy], NOW)).toEqual([]);
  });

  test('sin doneAt pero sin marcar se conserva', () => {
    const legacy = task({ id: 'a' });
    delete (legacy as Partial<Task>).doneAt;

    expect(withoutExpiredTasks([legacy], NOW)).toEqual([legacy]);
  });

  test('solo quita las que expiraron, deja el resto intacto', () => {
    const pending = task({ id: 'a' });
    const doneToday = task({ id: 'b', done: true, doneAt: EARLIER_TODAY });
    const doneYesterday = task({
      id: 'c',
      done: true,
      doneAt: YESTERDAY_EVENING,
    });

    expect(
      withoutExpiredTasks([pending, doneToday, doneYesterday], NOW),
    ).toEqual([pending, doneToday]);
  });
});
