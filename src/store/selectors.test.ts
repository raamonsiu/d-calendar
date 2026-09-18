import { expectDayLength } from '@/lib/clockChange.testing';
import { MIDNIGHT } from '@/lib/habits';
import type { CalEvent, Habit, Task } from '@/types';
import {
  layoutDay,
  layoutDayColumn,
  splitAllDay,
  taskDueLabel,
  tasksForHome,
  welcomeCounts,
  welcomeMessage,
} from './selectors';

/** A moment on the one day these tests use, so a test only says the hour. */
const at = (hour: number, minute = 0) =>
  new Date(2026, 0, 1, hour, minute).getTime();

/** Minimal event, so each test only sets what it actually varies. */
function event(fields: Partial<CalEvent> & { id: string }): CalEvent {
  return {
    title: 'Evento',
    description: '',
    location: '',
    startsAt: 0,
    endsAt: 0,
    allDay: false,
    calendarId: 'cal-1',
    availability: 'Ocupado',
    visibility: 'Predet.',
    repeat: 'No',
    weekdays: [],
    guests: [],
    reminders: [],
    ...fields,
  };
}

/** Event of the fixed test day, given as the hours it starts and ends. */
const timedEvent = (id: string, startHour: number, endHour: number) =>
  event({ id, startsAt: at(startHour), endsAt: at(endHour) });

describe('splitAllDay', () => {
  test('separa los eventos de todo el dia de los que tienen hora', () => {
    const holiday = event({ id: 'a', allDay: true });
    const meeting = event({ id: 'b', allDay: false });
    const birthday = event({ id: 'c', allDay: true });
    const lunch = event({ id: 'd', allDay: false });

    const { allDay, timed } = splitAllDay([holiday, meeting, birthday, lunch]);

    expect(allDay.map((entry) => entry.id)).toEqual(['a', 'c']);
    expect(timed.map((entry) => entry.id)).toEqual(['b', 'd']);
  });

  test('un dia vacio no pierde ni gana eventos', () => {
    expect(splitAllDay([])).toEqual({ allDay: [], timed: [] });
  });

  test('un dia sin eventos de todo el dia deja esa lista vacia', () => {
    const { allDay } = splitAllDay([event({ id: 'a', allDay: false })]);
    expect(allDay).toEqual([]);
  });
});

describe('layoutDay', () => {
  const HOUR_WIDTH = 62;

  test('un evento de una hora empieza donde su hora empieza', () => {
    const [placed] = layoutDay([timedEvent('a', 9, 10)], HOUR_WIDTH);
    expect(placed.left).toBe(9 * HOUR_WIDTH);
  });

  test('dos eventos que no se superponen comparten el carril 0', () => {
    const morning = timedEvent('a', 9, 10);
    const afternoon = timedEvent('b', 14, 15);

    const placed = layoutDay([morning, afternoon], HOUR_WIDTH);
    expect(placed.map((entry) => entry.lane)).toEqual([0, 0]);
  });

  test('dos eventos que se superponen van a carriles distintos', () => {
    const first = timedEvent('a', 9, 10);
    const overlapping = event({ id: 'b', startsAt: at(9, 30), endsAt: at(10, 30) });

    const placed = layoutDay([first, overlapping], HOUR_WIDTH);
    expect(placed[0].lane).not.toBe(placed[1].lane);
  });

  test('un evento que acaba al dia siguiente se corta al final del dia', () => {
    const overnight = event({
      id: 'a',
      startsAt: at(22),
      endsAt: new Date(2026, 0, 2, 1, 0).getTime(),
    });

    const [placed] = layoutDay([overnight], HOUR_WIDTH);
    expect(placed.width).toBe((24 - 22) * HOUR_WIDTH - 5);
  });
});

describe('layoutDayColumn', () => {
  const HOUR_HEIGHT = 60;
  const COLUMN_WIDTH = 104;
  /** Room the layout leaves between a card and the edge of the next hour. */
  const CARD_INSET = 5;

  test('dos eventos superpuestos comparten el ancho de la columna', () => {
    const first = timedEvent('a', 9, 10);
    const overlapping = event({ id: 'b', startsAt: at(9, 30), endsAt: at(10, 30) });

    const placed = layoutDayColumn([first, overlapping], HOUR_HEIGHT, COLUMN_WIDTH);
    expect(placed[0].width).toBeLessThan(COLUMN_WIDTH);
    expect(placed[1].width).toBeLessThan(COLUMN_WIDTH);
  });

  test('un evento solo en su hora ocupa la columna entera', () => {
    const [placed] = layoutDayColumn(
      [timedEvent('a', 9, 10)],
      HOUR_HEIGHT,
      COLUMN_WIDTH,
    );
    expect(placed.width).toBe(COLUMN_WIDTH - CARD_INSET);
  });
});

/** Minimal task, so each test only sets what it actually varies. */
function task(fields: Partial<Task> & { id: string }): Task {
  return {
    title: 'Tarea',
    description: '',
    calendarId: 'cal-1',
    dueAt: null,
    hasTime: false,
    vagueMonth: null,
    done: false,
    doneAt: null,
    reminders: [],
    ...fields,
  };
}

/** Minimal daily habit, so each test only sets what it actually varies. */
function habit(fields: Partial<Habit> & { id: string }): Habit {
  return {
    name: 'Hábito',
    description: '',
    frequency: 'Diario',
    target: 1,
    weekdays: [],
    reminders: [],
    progress: 0,
    streak: 0,
    periodStart: null,
    ...fields,
  };
}

describe('welcomeCounts', () => {
  const noon = at(12, 0);

  test('counts the events that have not ended yet today, not the ones already over', () => {
    const finished = timedEvent('a', 8, 9);
    const ongoing = timedEvent('b', 11, 13);
    const upcoming = timedEvent('c', 15, 16);

    const counts = welcomeCounts(
      [finished, ongoing, upcoming],
      [],
      [],
      'Lunes',
      MIDNIGHT,
      noon,
    );

    expect(counts.events).toBe(2);
  });

  test('counts the tasks due today or earlier that are still not done', () => {
    const overdue = task({
      id: 'a',
      dueAt: new Date(2025, 11, 31, 9, 0).getTime(),
    });
    const dueToday = task({ id: 'b', dueAt: at(18, 0) });
    const doneToday = task({ id: 'c', dueAt: at(10, 0), done: true });
    const someday = task({ id: 'd', dueAt: null, vagueMonth: 'Sin mes' });

    const counts = welcomeCounts(
      [],
      [overdue, dueToday, doneToday, someday],
      [],
      'Lunes',
      MIDNIGHT,
      noon,
    );

    expect(counts.tasks).toBe(2);
  });

  test('counts the habits still pending in the current period', () => {
    const done = habit({ id: 'a', progress: 1, target: 1, periodStart: at(0, 0) });
    const pending = habit({ id: 'b', progress: 0, target: 1, periodStart: at(0, 0) });

    const counts = welcomeCounts(
      [],
      [],
      [done, pending],
      'Lunes',
      MIDNIGHT,
      noon,
    );

    expect(counts.habits).toBe(1);
  });

  test('a habit done in a period that is already over counts as pending again', () => {
    const doneYesterday = habit({
      id: 'a',
      progress: 1,
      target: 1,
      periodStart: new Date(2025, 11, 31).getTime(),
    });

    const counts = welcomeCounts(
      [],
      [],
      [doneYesterday],
      'Lunes',
      MIDNIGHT,
      noon,
    );

    expect(counts.habits).toBe(1);
  });

  test('counts an all-day event for the whole day, whatever hours it is stored with', () => {
    const holiday = event({
      id: 'a',
      allDay: true,
      startsAt: at(10, 0),
      endsAt: at(10, 30),
    });

    const counts = welcomeCounts([holiday], [], [], 'Lunes', MIDNIGHT, at(18, 0));

    expect(counts.events).toBe(1);
  });

  test('a habit done before a custom day-end still counts as done', () => {
    const periodStart = new Date(2026, 0, 1, 4, 0).getTime();
    const earlyNextMorning = new Date(2026, 0, 2, 2, 0).getTime();
    const done = habit({ id: 'a', progress: 1, target: 1, periodStart });

    const counts = welcomeCounts(
      [],
      [],
      [done],
      'Lunes',
      { hour: 4, minute: 0 },
      earlyNextMorning,
    );

    expect(counts.habits).toBe(0);
  });

  test("on the 25-hour clock-change day, a task due at 23:30 is still today's", () => {
    expectDayLength(new Date(2026, 9, 25), 25);

    const lateTonight = task({
      id: 'a',
      dueAt: new Date(2026, 9, 25, 23, 30).getTime(),
    });

    const counts = welcomeCounts(
      [],
      [lateTonight],
      [],
      'Lunes',
      MIDNIGHT,
      new Date(2026, 9, 25, 12, 0).getTime(),
    );

    expect(counts.tasks).toBe(1);
  });

  test("on the 23-hour clock-change day, a task due tomorrow at 00:30 is not today's", () => {
    expectDayLength(new Date(2027, 2, 28), 23);

    const earlyTomorrow = task({
      id: 'a',
      dueAt: new Date(2027, 2, 29, 0, 30).getTime(),
    });

    const counts = welcomeCounts(
      [],
      [earlyTomorrow],
      [],
      'Lunes',
      MIDNIGHT,
      new Date(2027, 2, 28, 12, 0).getTime(),
    );

    expect(counts.tasks).toBe(0);
  });

  test('does not count a timed event tomorrow, nor an all-day event tomorrow or yesterday', () => {
    const tomorrowMeeting = event({
      id: 'a',
      startsAt: new Date(2026, 0, 2, 9, 0).getTime(),
      endsAt: new Date(2026, 0, 2, 10, 0).getTime(),
    });
    const tomorrowHoliday = event({
      id: 'b',
      allDay: true,
      startsAt: new Date(2026, 0, 2).getTime(),
      endsAt: new Date(2026, 0, 3).getTime(),
    });
    const yesterdayHoliday = event({
      id: 'c',
      allDay: true,
      startsAt: new Date(2025, 11, 31).getTime(),
      endsAt: new Date(2026, 0, 1).getTime(),
    });

    const counts = welcomeCounts(
      [tomorrowMeeting, tomorrowHoliday, yesterdayHoliday],
      [],
      [],
      'Lunes',
      MIDNIGHT,
      noon,
    );

    expect(counts.events).toBe(0);
  });

  test('does not count an event that began yesterday and is still running, just like Home', () => {
    const overnight = event({
      id: 'a',
      startsAt: new Date(2025, 11, 31, 22, 0).getTime(),
      endsAt: at(13, 0),
    });

    const counts = welcomeCounts([overnight], [], [], 'Lunes', MIDNIGHT, noon);

    expect(counts.events).toBe(0);
  });
});

describe('tasksForHome', () => {
  test("on the 25-hour clock-change day, keeps the 23:30 task and leaves out tomorrow's", () => {
    expectDayLength(new Date(2026, 9, 25), 25);

    const lateTonight = task({
      id: 'a',
      dueAt: new Date(2026, 9, 25, 23, 30).getTime(),
    });
    const tomorrow = task({
      id: 'b',
      dueAt: new Date(2026, 9, 26, 0, 30).getTime(),
    });

    const shown = tasksForHome(
      [lateTonight, tomorrow],
      new Date(2026, 9, 25, 12, 0).getTime(),
    );

    expect(shown.map((shownTask) => shownTask.id)).toEqual(['a']);
  });

  test('on the 23-hour clock-change day, leaves out a task due tomorrow at 00:30', () => {
    expectDayLength(new Date(2027, 2, 28), 23);

    const earlyTomorrow = task({
      id: 'a',
      dueAt: new Date(2027, 2, 29, 0, 30).getTime(),
    });

    const shown = tasksForHome(
      [earlyTomorrow],
      new Date(2027, 2, 28, 12, 0).getTime(),
    );

    expect(shown).toEqual([]);
  });
});

describe('taskDueLabel', () => {
  test('on the 25-hour clock-change day, a task due tomorrow reads MAÑANA', () => {
    expectDayLength(new Date(2026, 9, 25), 25);

    const tomorrow = task({
      id: 'a',
      dueAt: new Date(2026, 9, 26, 10, 0).getTime(),
      hasTime: true,
    });

    expect(
      taskDueLabel(tomorrow, 'es', new Date(2026, 9, 25, 12, 0).getTime()),
    ).toBe('MAÑANA');
  });
});

describe('welcomeMessage', () => {
  test('before the device calendars are read, gives no events count and never says nothing is left', () => {
    const message = welcomeMessage({ events: 0, tasks: 0, habits: 0 }, false);

    expect(message.events).toBeNull();
    expect(message.allDone).toBe(false);
  });

  test('before the device calendars are read, still gives the tasks and habits', () => {
    const message = welcomeMessage({ events: 0, tasks: 2, habits: 1 }, false);

    expect(message).toEqual({
      events: null,
      tasks: 2,
      habits: 1,
      allDone: false,
    });
  });

  test('with the calendars read and everything at zero, says nothing is left', () => {
    const message = welcomeMessage({ events: 0, tasks: 0, habits: 0 }, true);

    expect(message.allDone).toBe(true);
  });

  test('with the calendars read, gives the events count', () => {
    const message = welcomeMessage({ events: 3, tasks: 0, habits: 0 }, true);

    expect(message.events).toBe(3);
    expect(message.allDone).toBe(false);
  });
});
