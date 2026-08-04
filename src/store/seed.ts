import { addDays, startOfDay } from '@/lib/date';
import { color } from '@/theme/tokens';
import type { Account, CalEvent, Calendar, Habit, Task } from '@/types';

/**
 * Startup data: the prototype's own (`pre-info/*.dc.html`), moved around the
 * real date so the app looks like the design.
 *
 * Everything lives in memory. None of this reaches an endpoint yet, so this
 * whole module goes away once syncing is real.
 */

export const ACCOUNTS: Account[] = [
  { id: 'acc-1', email: 'dani@digimevo.com', initial: 'D', provider: 'GOOGLE' },
  {
    id: 'acc-2',
    email: 'daniel.perez@gmail.com',
    initial: 'P',
    provider: 'GOOGLE',
  },
  { id: 'acc-3', email: 'casa@icloud.com', initial: 'C', provider: 'ICLOUD' },
];

/**
 * Calendars from the prototype. `dotColor: null` means the calendar is drawn
 * with the app accent; the ones with `accountId: null` are the "Otros
 * calendarios" subscriptions, which are read only.
 */
export const CALENDARS: Calendar[] = [
  {
    id: 'cal-personal',
    name: 'Personal',
    dotColor: null,
    kind: '',
    accountId: 'acc-1',
    visible: true,
  },
  {
    id: 'cal-trabajo',
    name: 'Trabajo',
    dotColor: color.textMuted,
    kind: '',
    accountId: 'acc-1',
    visible: true,
  },
  {
    id: 'cal-tareas',
    name: 'Tareas',
    dotColor: color.textNote,
    kind: 'TAREAS',
    accountId: 'acc-1',
    visible: true,
  },
  {
    id: 'cal-familia',
    name: 'Familia',
    dotColor: color.textMuted,
    kind: '',
    accountId: 'acc-2',
    visible: true,
  },
  {
    id: 'cal-cumples',
    name: 'Cumpleaños',
    dotColor: color.textDisabled,
    kind: '',
    accountId: 'acc-2',
    visible: false,
  },
  {
    id: 'cal-icloud-casa',
    name: 'iCloud · Casa',
    dotColor: color.textMuted,
    kind: 'CALDAV',
    accountId: 'acc-3',
    visible: true,
  },
  {
    id: 'cal-festivos',
    name: 'Festivos España',
    dotColor: color.textDisabled,
    kind: 'ICS',
    accountId: null,
    visible: true,
    readOnly: true,
  },
  {
    id: 'cal-liga',
    name: 'Liga · Calendario',
    dotColor: color.textDisabled,
    kind: 'ICS',
    accountId: null,
    visible: false,
    readOnly: true,
  },
];

/** Event template: hours in decimal so they can be shifted by adding. */
type EventTemplate = {
  startHour: number;
  endHour: number;
  title: string;
  calendarId: string;
};

/** The six events of today from the prototype. */
const TODAY_EVENTS: EventTemplate[] = [
  { startHour: 8, endHour: 9, title: 'Gimnasio', calendarId: 'cal-personal' },
  {
    startHour: 9.5,
    endHour: 10.25,
    title: 'Daily equipo',
    calendarId: 'cal-trabajo',
  },
  {
    startHour: 11,
    endHour: 12.5,
    title: 'Revisión de diseño',
    calendarId: 'cal-trabajo',
  },
  {
    startHour: 13.5,
    endHour: 14.25,
    title: 'Comida con Marta',
    calendarId: 'cal-personal',
  },
  {
    startHour: 16,
    endHour: 17.5,
    title: 'Bloque foco',
    calendarId: 'cal-trabajo',
  },
  {
    startHour: 19,
    endHour: 20,
    title: 'Cena en casa de Ana',
    calendarId: 'cal-familia',
  },
];

/** Filler so the week and the month have event dots. */
const FILLER_EVENTS: EventTemplate[] = [
  { startHour: 9, endHour: 9.5, title: 'Standup', calendarId: 'cal-trabajo' },
  {
    startHour: 10.5,
    endHour: 12,
    title: 'Sesión de trabajo',
    calendarId: 'cal-trabajo',
  },
  { startHour: 12.5, endHour: 13.5, title: 'Comida', calendarId: 'cal-personal' },
  {
    startHour: 15,
    endHour: 16,
    title: 'Recogida del cole',
    calendarId: 'cal-familia',
  },
  {
    startHour: 17,
    endHour: 18.5,
    title: 'Entrenamiento',
    calendarId: 'cal-personal',
  },
  { startHour: 20, endHour: 21.5, title: 'Cine', calendarId: 'cal-personal' },
];

/**
 * How many filler events each day carries. It is a fixed table, same as in the
 * prototype: with random numbers the app would look different on every launch.
 */
const EVENTS_PER_DAY = [
  0, 2, 4, 6, 3, 5, 1, 0, 3, 2, 5, 1, 4, 0, 2, 6, 3, 1, 5, 2, 0, 4, 3, 1, 2, 5,
  0, 3, 6, 2, 4,
];

/**
 * Filler days before and after today: they cover the week and the month scroll.
 */
const FILLER_DAYS_BEFORE = 21;
const FILLER_DAYS_AFTER = 45;

/** The lunch event brings a guest so the guest list can be seen populated. */
const TODAY_EVENT_WITH_GUEST = 3;

/**
 * Converts a decimal hour into the timestamp of that moment of a day.
 *
 * Precondition: `hours` is between 0 and 24. Postcondition: returns an instant
 * on the same day as `day`, with seconds at 0.
 *
 * @param day Reference day.
 * @param hours Hour in decimal, for example 9.5 for 09:30.
 */
function timestampAt(day: Date, hours: number) {
  const hour = Math.floor(hours);
  const minutes = Math.round((hours - hour) * 60);
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hour,
    minutes,
    0,
    0,
  ).getTime();
}

/**
 * Builds a complete event out of a template.
 *
 * Postcondition: the event carries the defaults of the Crear form (busy,
 * default visibility, no repetition) and a reminder 15 minutes before.
 *
 * @param id Id assigned to the event.
 * @param day Day it falls on.
 * @param template Hours, title and calendar.
 */
function buildEvent(id: string, day: Date, template: EventTemplate): CalEvent {
  return {
    id,
    title: template.title,
    description: '',
    startsAt: timestampAt(day, template.startHour),
    endsAt: timestampAt(day, template.endHour),
    allDay: false,
    calendarId: template.calendarId,
    availability: 'Ocupado',
    visibility: 'Predet.',
    repeat: 'No',
    weekdays: [],
    guests: [],
    reminders: [{ id: `${id}-r0`, value: 15, unit: 0 }],
  };
}

/**
 * Startup events: the six of today plus the filler for the surrounding weeks.
 *
 * Postcondition: every event has a unique id and falls between
 * `FILLER_DAYS_BEFORE` days before today and `FILLER_DAYS_AFTER` days after.
 */
export function seedEvents(): CalEvent[] {
  const today = startOfDay(new Date());
  const events: CalEvent[] = [];

  TODAY_EVENTS.forEach((template, position) => {
    const event = buildEvent(`ev-today-${position}`, today, template);
    if (position === TODAY_EVENT_WITH_GUEST) {
      event.guests = [
        { id: 'g-marta', name: 'Marta Ruiz', initial: 'M', state: 'PENDIENTE' },
      ];
    }
    events.push(event);
  });

  for (
    let dayOffset = -FILLER_DAYS_BEFORE;
    dayOffset <= FILLER_DAYS_AFTER;
    dayOffset += 1
  ) {
    if (dayOffset === 0) continue;

    const day = addDays(today, dayOffset);
    const dayIndex =
      Math.abs(day.getDate() + day.getMonth()) % EVENTS_PER_DAY.length;
    const eventCount = EVENTS_PER_DAY[dayIndex];

    for (let position = 0; position < eventCount; position += 1) {
      const template =
        FILLER_EVENTS[(position + day.getDate()) % FILLER_EVENTS.length];
      /** Half an hour up or down so the overlaps do not come out identical. */
      const shift = ((position % 3) - 1) * 0.5;

      events.push(
        buildEvent(`ev-${dayOffset}-${position}`, day, {
          ...template,
          startHour: template.startHour + shift,
          endHour: template.endHour + shift,
        }),
      );
    }
  }

  return events;
}

/**
 * The five tasks from the prototype: one overdue, one done and three pending.
 */
export function seedTasks(): Task[] {
  const today = startOfDay(new Date());

  return [
    {
      id: 'task-1',
      title: 'Enviar presupuesto a Nordic',
      description: '',
      calendarId: 'cal-tareas',
      dueAt: timestampAt(today, 11),
      hasTime: true,
      vagueMonth: null,
      done: false,
      reminders: [{ id: 'task-1-r0', value: 15, unit: 0 }],
    },
    {
      id: 'task-2',
      title: 'Revisar PR #482',
      description: '',
      calendarId: 'cal-tareas',
      dueAt: today.getTime(),
      hasTime: false,
      vagueMonth: null,
      done: false,
      reminders: [],
    },
    {
      id: 'task-3',
      title: 'Comprar regalo de Ana',
      description: '',
      calendarId: 'cal-tareas',
      dueAt: null,
      hasTime: false,
      vagueMonth: null,
      done: true,
      reminders: [],
    },
    {
      id: 'task-4',
      title: 'Llamar al dentista',
      description: '',
      calendarId: 'cal-tareas',
      dueAt: addDays(today, -1).getTime(),
      hasTime: false,
      vagueMonth: null,
      done: false,
      reminders: [],
    },
    {
      id: 'task-5',
      title: 'Cerrar sprint en Linear',
      description: '',
      calendarId: 'cal-tareas',
      dueAt: timestampAt(today, 18),
      hasTime: true,
      vagueMonth: null,
      done: false,
      reminders: [{ id: 'task-5-r0', value: 30, unit: 0 }],
    },
  ];
}

/** The six habits from the prototype, one of each frequency. */
export function seedHabits(): Habit[] {
  return [
    {
      id: 'habit-1',
      name: 'Leer 20 min',
      description: '',
      frequency: 'Diario',
      target: 1,
      weekdays: [],
      reminders: [{ id: 'habit-1-r0', time: '22:00' }],
      progress: 1,
      streak: 12,
    },
    {
      id: 'habit-2',
      name: 'Agua',
      description: '',
      frequency: 'X por día',
      target: 5,
      weekdays: [],
      reminders: [
        { id: 'habit-2-r0', time: '09:00' },
        { id: 'habit-2-r1', time: '14:00' },
        { id: 'habit-2-r2', time: '18:00' },
      ],
      progress: 2,
      streak: 23,
    },
    {
      id: 'habit-3',
      name: 'Meditar',
      description: '',
      frequency: 'Diario',
      target: 1,
      weekdays: [],
      reminders: [{ id: 'habit-3-r0', time: '07:00' }],
      progress: 0,
      streak: 8,
    },
    {
      id: 'habit-4',
      name: 'Gimnasio',
      description: '',
      frequency: 'X por semana',
      target: 3,
      weekdays: [1, 3, 5],
      reminders: [{ id: 'habit-4-r0', time: '08:00' }],
      progress: 0,
      streak: 6,
    },
    {
      id: 'habit-5',
      name: 'Llamar a mamá',
      description: '',
      frequency: 'Semanal',
      target: 1,
      weekdays: [0],
      reminders: [{ id: 'habit-5-r0', time: '12:00' }],
      progress: 0,
      streak: 4,
    },
    {
      id: 'habit-6',
      name: 'Diario',
      description: '',
      frequency: 'Diario',
      target: 1,
      weekdays: [],
      reminders: [{ id: 'habit-6-r0', time: '21:00' }],
      progress: 0,
      streak: 41,
    },
  ];
}
