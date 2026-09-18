import type { Habit, LastChanceWeeklyDay, Task } from '@/types';
import { expectDayLength } from './clockChange.testing';
import { MIDNIGHT } from './habits';
import { planNotifications, type NotificationPlanInput } from './notifications';

/** Lunes 10 de agosto de 2026, 09:00. */
const NOW = new Date(2026, 7, 10, 9, 0).getTime();

/** Last chance switched off, which is what most tests want out of the way. */
const LAST_CHANCE_OFF = {
  daily: false,
  dailyTime: '20:00',
  weekly: false,
  weeklyDay: 'Último' as LastChanceWeeklyDay,
  weeklyTime: '00:00',
};

/** Minimal plan input, with what each test overrides on top. */
function planInput(fields: Partial<NotificationPlanInput> = {}): NotificationPlanInput {
  return {
    events: [],
    tasks: [],
    habits: [],
    weekStart: 'Lunes',
    dayEnd: MIDNIGHT,
    lastChance: LAST_CHANCE_OFF,
    ...fields,
  };
}

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
    const plan = planNotifications(planInput({ tasks: [task()] }), NOW, 'en');
    expect(plan).toHaveLength(1);
  });

  test('a done task drops out of the plan', () => {
    const plan = planNotifications(
      planInput({ tasks: [task({ done: true })] }),
      NOW,
      'en',
    );
    expect(plan).toHaveLength(0);
  });

  test('unmarking a task brings its reminder back', () => {
    const doneTask = task({ done: true });
    const undoneTask = { ...doneTask, done: false };
    const plan = planNotifications(planInput({ tasks: [undoneTask] }), NOW, 'en');
    expect(plan).toHaveLength(1);
  });
});

describe('planNotifications with habits', () => {
  test('a habit still pending for the period is reminded', () => {
    const plan = planNotifications(planInput({ habits: [habit()] }), NOW, 'en');
    expect(plan).toHaveLength(1);
  });

  test('a habit already done for the period stops reminding', () => {
    const plan = planNotifications(
      planInput({ habits: [habit({ progress: 1 })] }),
      NOW,
      'en',
    );
    expect(plan).toHaveLength(0);
  });

  test('undoing the repetition brings the reminder back', () => {
    const done = habit({ progress: 1 });
    const undone = { ...done, progress: 0 };
    const plan = planNotifications(planInput({ habits: [undone] }), NOW, 'en');
    expect(plan).toHaveLength(1);
  });

  test('a partially done "X per day" habit keeps reminding', () => {
    const plan = planNotifications(
      planInput({
        habits: [habit({ frequency: 'X por día', target: 3, progress: 2 })],
      }),
      NOW,
      'en',
    );
    expect(plan).toHaveLength(1);
  });
});

describe('planNotifications last chance, daily', () => {
  test('off by default in these tests, so a pending day stays silent', () => {
    const plan = planNotifications(
      planInput({ tasks: [task({ dueAt: NOW - 3600000 })] }),
      NOW,
      'en',
    );
    expect(plan).toHaveLength(0);
  });

  test('fires when a task due today is still pending', () => {
    const plan = planNotifications(
      planInput({
        tasks: [task({ dueAt: NOW + 3600000 })],
        lastChance: { ...LAST_CHANCE_OFF, daily: true, dailyTime: '20:00' },
      }),
      NOW,
      'en',
    );
    const lastChance = plan.find((entry) => entry.id.startsWith('lastchance:daily'));
    expect(lastChance).toBeDefined();
    expect(lastChance?.body).toContain('1 task');
  });

  test('an overdue task still counts as today\'s', () => {
    const plan = planNotifications(
      planInput({
        tasks: [task({ dueAt: NOW - 26 * 3600000 })],
        lastChance: { ...LAST_CHANCE_OFF, daily: true, dailyTime: '20:00' },
      }),
      NOW,
      'en',
    );
    expect(plan.some((entry) => entry.id.startsWith('lastchance:daily'))).toBe(true);
  });

  test('a task due tomorrow does not count towards today', () => {
    const plan = planNotifications(
      planInput({
        tasks: [task({ dueAt: NOW + 26 * 3600000 })],
        lastChance: { ...LAST_CHANCE_OFF, daily: true, dailyTime: '20:00' },
      }),
      NOW,
      'en',
    );
    expect(plan.some((entry) => entry.id.startsWith('lastchance:daily'))).toBe(false);
  });

  test('a weekly habit does not count towards the daily summary', () => {
    const plan = planNotifications(
      planInput({
        habits: [habit({ frequency: 'Semanal' })],
        lastChance: { ...LAST_CHANCE_OFF, daily: true, dailyTime: '20:00' },
      }),
      NOW,
      'en',
    );
    expect(plan.some((entry) => entry.id.startsWith('lastchance:daily'))).toBe(false);
  });

  test('nothing pending means no summary at all', () => {
    const plan = planNotifications(
      planInput({
        tasks: [task({ done: true })],
        habits: [habit({ progress: 1 })],
        lastChance: { ...LAST_CHANCE_OFF, daily: true, dailyTime: '20:00' },
      }),
      NOW,
      'en',
    );
    expect(plan.some((entry) => entry.id.startsWith('lastchance:daily'))).toBe(false);
  });

  test('an hour already gone by today does not fire retroactively', () => {
    const plan = planNotifications(
      planInput({
        tasks: [task()],
        lastChance: { ...LAST_CHANCE_OFF, daily: true, dailyTime: '08:00' },
      }),
      NOW,
      'en',
    );
    expect(plan.some((entry) => entry.id.startsWith('lastchance:daily'))).toBe(false);
  });
});

describe('planNotifications last chance, weekly', () => {
  test('fires on the last day for a still-pending weekly habit', () => {
    const sunday = new Date(2026, 7, 16, 9, 0).getTime();
    const plan = planNotifications(
      planInput({
        habits: [habit({ frequency: 'Semanal', periodStart: sunday })],
        lastChance: {
          ...LAST_CHANCE_OFF,
          weekly: true,
          weeklyDay: 'Último',
          weeklyTime: '10:00',
        },
      }),
      sunday,
      'en',
    );
    const lastChance = plan.find((entry) => entry.id.startsWith('lastchance:weekly'));
    expect(lastChance).toBeDefined();
    expect(lastChance?.body).toContain('1 habit');
  });

  test('a daily habit does not count towards the weekly summary', () => {
    const sunday = new Date(2026, 7, 16, 9, 0).getTime();
    const plan = planNotifications(
      planInput({
        habits: [habit({ frequency: 'Diario' })],
        lastChance: {
          ...LAST_CHANCE_OFF,
          weekly: true,
          weeklyDay: 'Último',
          weeklyTime: '10:00',
        },
      }),
      sunday,
      'en',
    );
    expect(plan.some((entry) => entry.id.startsWith('lastchance:weekly'))).toBe(false);
  });

  test('"Penúltimo" fires a day earlier than "Último"', () => {
    const saturday = new Date(2026, 7, 15, 9, 0).getTime();
    const plan = planNotifications(
      planInput({
        habits: [habit({ frequency: 'Semanal', periodStart: saturday })],
        lastChance: {
          ...LAST_CHANCE_OFF,
          weekly: true,
          weeklyDay: 'Penúltimo',
          weeklyTime: '10:00',
        },
      }),
      saturday,
      'en',
    );
    expect(plan.some((entry) => entry.id.startsWith('lastchance:weekly'))).toBe(true);
  });

  test('the target day still lands on the last day across the DST clock change', () => {
    /**
     * Sunday 25 October 2026 to Saturday 31 October, with the week starting on
     * Sunday: the week itself contains the small hours in which Spain turns
     * the clock back, making it 25 hours long. Adding "Último" (6 days) as a
     * fixed millisecond duration instead of calendar days would land on
     * Friday evening instead of Saturday, and the notification would either
     * fire a day early or read as already gone by the time this test's `now`
     * arrives - either way, it would not fire at 10:00 on the intended day.
     */
    expectDayLength(new Date(2026, 9, 25), 25);

    const saturdayMorning = new Date(2026, 9, 31, 9, 0).getTime();
    const plan = planNotifications(
      planInput({
        weekStart: 'Domingo',
        habits: [habit({ frequency: 'Semanal' })],
        lastChance: {
          ...LAST_CHANCE_OFF,
          weekly: true,
          weeklyDay: 'Último',
          weeklyTime: '10:00',
        },
      }),
      saturdayMorning,
      'en',
    );
    const lastChance = plan.find((entry) => entry.id.startsWith('lastchance:weekly'));
    expect(lastChance).toBeDefined();
    expect(lastChance?.trigger).toEqual({
      kind: 'date',
      at: new Date(2026, 9, 31, 10, 0).getTime(),
    });
  });
});
