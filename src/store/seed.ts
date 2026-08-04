import { addDays, startOfDay } from '@/lib/date';
import type {
  Account,
  CalEvent,
  Calendar,
  Habit,
  Task,
} from '@/types';

/**
 * Datos de arranque. Son los del prototipo (`pre-info/*.dc.html`), recolocados
 * alrededor de la fecha real para que la app se vea como el diseño.
 * Todo vive en memoria: nada de esto llega a un endpoint todavía.
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

export const CALENDARS: Calendar[] = [
  // dot: null = el calendario se pinta con el acento de la app.
  {
    id: 'cal-personal',
    name: 'Personal',
    dot: null,
    kind: '',
    accountId: 'acc-1',
    visible: true,
  },
  {
    id: 'cal-trabajo',
    name: 'Trabajo',
    dot: '#8a8a93',
    kind: '',
    accountId: 'acc-1',
    visible: true,
  },
  {
    id: 'cal-tareas',
    name: 'Tareas',
    dot: '#b9b9c1',
    kind: 'TAREAS',
    accountId: 'acc-1',
    visible: true,
  },
  {
    id: 'cal-familia',
    name: 'Familia',
    dot: '#8a8a93',
    kind: '',
    accountId: 'acc-2',
    visible: true,
  },
  {
    id: 'cal-cumples',
    name: 'Cumpleaños',
    dot: '#5c5c65',
    kind: '',
    accountId: 'acc-2',
    visible: false,
  },
  {
    id: 'cal-icloud-casa',
    name: 'iCloud · Casa',
    dot: '#8a8a93',
    kind: 'CALDAV',
    accountId: 'acc-3',
    visible: true,
  },
  // Otros calendarios: suscripciones sin cuenta, de solo lectura.
  {
    id: 'cal-festivos',
    name: 'Festivos España',
    dot: '#5c5c65',
    kind: 'ICS',
    accountId: null,
    visible: true,
    readOnly: true,
  },
  {
    id: 'cal-liga',
    name: 'Liga · Calendario',
    dot: '#5c5c65',
    kind: 'ICS',
    accountId: null,
    visible: false,
    readOnly: true,
  },
];

type Template = {
  s: number;
  e: number;
  t: string;
  cal: string;
};

/** Los seis eventos de hoy del prototipo. */
const TODAY_EVENTS: Template[] = [
  { s: 8, e: 9, t: 'Gimnasio', cal: 'cal-personal' },
  { s: 9.5, e: 10.25, t: 'Daily equipo', cal: 'cal-trabajo' },
  { s: 11, e: 12.5, t: 'Revisión de diseño', cal: 'cal-trabajo' },
  { s: 13.5, e: 14.25, t: 'Comida con Marta', cal: 'cal-personal' },
  { s: 16, e: 17.5, t: 'Bloque foco', cal: 'cal-trabajo' },
  { s: 19, e: 20, t: 'Cena en casa de Ana', cal: 'cal-familia' },
];

/** Relleno para que la semana y el mes tengan puntos. */
const FILLER: Template[] = [
  { s: 9, e: 9.5, t: 'Standup', cal: 'cal-trabajo' },
  { s: 10.5, e: 12, t: 'Sesión de trabajo', cal: 'cal-trabajo' },
  { s: 12.5, e: 13.5, t: 'Comida', cal: 'cal-personal' },
  { s: 15, e: 16, t: 'Recogida del cole', cal: 'cal-familia' },
  { s: 17, e: 18.5, t: 'Entrenamiento', cal: 'cal-personal' },
  { s: 20, e: 21.5, t: 'Cine', cal: 'cal-personal' },
];

/** Mismo truco que el prototipo: una tabla fija en vez de aleatoriedad. */
const SEED_COUNTS = [
  0, 2, 4, 6, 3, 5, 1, 0, 3, 2, 5, 1, 4, 0, 2, 6, 3, 1, 5, 2, 0, 4, 3, 1, 2, 5,
  0, 3, 6, 2, 4,
];

const at = (day: Date, hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    h,
    m,
    0,
    0,
  ).getTime();
};

function makeEvent(id: string, day: Date, tpl: Template): CalEvent {
  return {
    id,
    title: tpl.t,
    description: '',
    start: at(day, tpl.s),
    end: at(day, tpl.e),
    allDay: false,
    calendarId: tpl.cal,
    availability: 'Ocupado',
    visibility: 'Predet.',
    repeat: 'No',
    weekdays: [],
    guests: [],
    reminders: [{ id: `${id}-r0`, value: 15, unit: 0 }],
  };
}

export function seedEvents(): CalEvent[] {
  const today = startOfDay(new Date());
  const out: CalEvent[] = [];

  TODAY_EVENTS.forEach((tpl, i) => {
    const ev = makeEvent(`ev-today-${i}`, today, tpl);
    if (i === 3) {
      ev.guests = [
        { id: 'g-marta', name: 'Marta Ruiz', initial: 'M', state: 'PENDIENTE' },
      ];
    }
    out.push(ev);
  });

  // 21 días antes y 45 después: suficiente para la semana y tres meses de scroll.
  for (let offset = -21; offset <= 45; offset++) {
    if (offset === 0) continue;
    const day = addDays(today, offset);
    const count = SEED_COUNTS[Math.abs(day.getDate() + day.getMonth()) % 31];
    for (let k = 0; k < count; k++) {
      const tpl = FILLER[(k + day.getDate()) % FILLER.length];
      const shift = ((k % 3) - 1) * 0.5;
      out.push(
        makeEvent(`ev-${offset}-${k}`, day, {
          ...tpl,
          s: tpl.s + shift,
          e: tpl.e + shift,
        }),
      );
    }
  }

  return out;
}

export function seedTasks(): Task[] {
  const today = startOfDay(new Date());
  const t = (h: number) => at(today, h);

  return [
    {
      id: 'task-1',
      title: 'Enviar presupuesto a Nordic',
      description: '',
      calendarId: 'cal-tareas',
      due: t(11),
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
      due: today.getTime(),
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
      due: null,
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
      // Vencida: la fila muestra VENCE.
      due: addDays(today, -1).getTime(),
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
      due: t(18),
      hasTime: true,
      vagueMonth: null,
      done: false,
      reminders: [{ id: 'task-5-r0', value: 30, unit: 0 }],
    },
  ];
}

export function seedHabits(): Habit[] {
  return [
    {
      id: 'habit-1',
      name: 'Leer 20 min',
      description: '',
      freq: 'Diario',
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
      freq: 'X por día',
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
      freq: 'Diario',
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
      freq: 'X por semana',
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
      freq: 'Semanal',
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
      freq: 'Diario',
      target: 1,
      weekdays: [],
      reminders: [{ id: 'habit-6-r0', time: '21:00' }],
      progress: 0,
      streak: 41,
    },
  ];
}
