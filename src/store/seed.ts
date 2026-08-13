import { NO_MONTH_VALUE } from '@/data/translations/domain';
import type { Language } from '@/lib/language';
import { color } from '@/theme/tokens';
import type { Account, CalEvent, Calendar, Habit, Task } from '@/types';

/**
 * What a fresh install starts with.
 *
 * There is no demo data for events any more: they come from the calendars of
 * the device, and putting made-up ones next to them made it impossible to
 * tell what was real. What is left is the two calendars the app needs to
 * have somewhere of its own to put things in, next to the ones of the device
 * it can now write to, and a handful of placeholder tasks and habits so a
 * first-time user has something to see and try instead of two empty boxes.
 */

/** The app writes to no account of its own, so there are none. */
export const ACCOUNTS: Account[] = [];

/**
 * The app's own calendars. `dotColor: null` means it is drawn with the accent.
 *
 * `cal-personal` is the default destination of a new event and is named in
 * `DEFAULT_PREFERENCES`; renaming its id means changing it there too.
 */
export const CALENDARS: Calendar[] = [
  {
    id: 'cal-personal',
    name: 'Personal',
    dotColor: null,
    kind: '',
    accountId: null,
    visible: true,
  },
  {
    id: 'cal-tareas',
    name: 'Tareas',
    dotColor: color.textNote,
    kind: 'TAREAS',
    accountId: null,
    visible: true,
  },
];

/** A fresh install has no events of its own; the device's are read instead. */
export const seedEvents = (): CalEvent[] => [];

/**
 * Placeholder tasks, written once in whatever language `detectLanguage`
 * guessed for the install: after this they are plain tasks like any other,
 * the user only checks them or deletes them.
 */
const SEED_TASK_TITLES: Record<Language, string[]> = {
  es: [
    'Crear mi primer hábito',
    'Crear un evento en el calendario',
    'Sincronizar los calendarios',
    'Verificar la configuración de la app',
  ],
  en: [
    'Create your first habit',
    'Create an event in the calendar',
    'Sync your calendars',
    'Check the app settings',
  ],
  ca: [
    'Crea el teu primer hàbit',
    'Crea un esdeveniment al calendari',
    'Sincronitza els calendaris',
    "Revisa la configuració de l'app",
  ],
};

/**
 * Placeholder tasks for a fresh install, done and doneAt both untouched, no
 * exact date - the same shape a task created without one gets in the form.
 *
 * @param language Language guessed at install time.
 */
export const seedTasks = (language: Language): Task[] =>
  SEED_TASK_TITLES[language].map((title, index) => ({
    id: `task-seed-${index}`,
    title,
    description: '',
    calendarId: 'cal-tareas',
    dueAt: null,
    hasTime: false,
    vagueMonth: NO_MONTH_VALUE,
    done: false,
    doneAt: null,
    reminders: [],
  }));

/**
 * Placeholder habits, one entry per language, name plus frequency and target
 * together since the three go hand in hand.
 */
const SEED_HABITS: Record<
  Language,
  { name: string; frequency: Habit['frequency']; target: number }[]
> = {
  es: [
    { name: 'Beber agua', frequency: 'X por día', target: 5 },
    { name: 'Leer 30 minutos', frequency: 'Diario', target: 1 },
    { name: 'Hacer deporte', frequency: 'X por semana', target: 4 },
  ],
  en: [
    { name: 'Drink water', frequency: 'X por día', target: 5 },
    { name: 'Read for 30 minutes', frequency: 'Diario', target: 1 },
    { name: 'Exercise', frequency: 'X por semana', target: 4 },
  ],
  ca: [
    { name: 'Beu aigua', frequency: 'X por día', target: 5 },
    { name: 'Llegeix 30 minuts', frequency: 'Diario', target: 1 },
    { name: 'Fes esport', frequency: 'X por semana', target: 4 },
  ],
};

/**
 * Placeholder habits for a fresh install, with no progress or streak yet.
 *
 * @param language Language guessed at install time.
 */
export const seedHabits = (language: Language): Habit[] =>
  SEED_HABITS[language].map((habit, index) => ({
    id: `habit-seed-${index}`,
    name: habit.name,
    description: '',
    frequency: habit.frequency,
    target: habit.target,
    weekdays: [],
    reminders: [],
    progress: 0,
    streak: 0,
  }));
