import type { Habit, Task } from '@/types';
import { planNotifications } from './notifications';

const NOW = new Date(2026, 7, 10, 9, 0).getTime();

/** Minimal task, with what each test overrides on top. */
function task(fields: Partial<Task> = {}): Task {
  return {
    id: 't',
    title: 'Task',
    description: '',
    calendarId: 'c',
    dueAt: NOW + 3600000,
    hasTime: true,
    vagueMonth: null,
    done: false,
    doneAt: null,
    reminders: [{ id: 'r', value: 15, unit: 0 }],
    ...fields,
  };
}

/** Minimal habit, with what each test overrides on top. */
function habit(fields: Partial<Habit> = {}): Habit {
  return {
    id: 'h',
    name: 'Habit',
    description: '',
    frequency: 'Diario',
    target: 1,
    weekdays: [],
    reminders: [{ id: 'r', time: '09:00' }],
    progress: 0,
    streak: 0,
    periodStart: NOW,
    ...fields,
  };
}

describe('planNotifications with tasks', () => {
  test('a pending task is reminded', () => {
    const plan = planNotifications({ events: [], tasks: [task()], habits: [] }, NOW, 'en');
    expect(plan).toHaveLength(1);
  });

  test('a done task drops out of the plan', () => {
    const plan = planNotifications(
      { events: [], tasks: [task({ done: true })], habits: [] },
      NOW,
      'en',
    );
    expect(plan).toHaveLength(0);
  });

  test('unmarking a task brings its reminder back', () => {
    const doneTask = task({ done: true });
    const undoneTask = { ...doneTask, done: false };
    const plan = planNotifications(
      { events: [], tasks: [undoneTask], habits: [] },
      NOW,
      'en',
    );
    expect(plan).toHaveLength(1);
  });
});

describe('planNotifications with habits', () => {
  test('a habit still pending for the period is reminded', () => {
    const plan = planNotifications({ events: [], tasks: [], habits: [habit()] }, NOW, 'en');
    expect(plan).toHaveLength(1);
  });

  test('a habit already done for the period stops reminding', () => {
    const plan = planNotifications(
      { events: [], tasks: [], habits: [habit({ progress: 1 })] },
      NOW,
      'en',
    );
    expect(plan).toHaveLength(0);
  });

  test('undoing the repetition brings the reminder back', () => {
    const done = habit({ progress: 1 });
    const undone = { ...done, progress: 0 };
    const plan = planNotifications({ events: [], tasks: [], habits: [undone] }, NOW, 'en');
    expect(plan).toHaveLength(1);
  });

  test('a partially done "X per day" habit keeps reminding', () => {
    const plan = planNotifications(
      { events: [], tasks: [], habits: [habit({ frequency: 'X por día', target: 3, progress: 2 })] },
      NOW,
      'en',
    );
    expect(plan).toHaveLength(1);
  });
});
