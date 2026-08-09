import { color } from '@/theme/tokens';
import type { Account, CalEvent, Calendar, Habit, Task } from '@/types';

/**
 * What a fresh install starts with.
 *
 * There is no demo data any more: the events come from the calendars of the
 * device, and putting made-up ones next to them made it impossible to tell what
 * was real. What is left is the two calendars the app needs to have somewhere
 * to put what it creates itself, since it does not write to the device's
 * calendars.
 *
 * They carry no account: they belong to the app and to this phone, which is
 * what the side menu draws them as.
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

/** Tasks are the app's own, and it starts with none. */
export const seedTasks = (): Task[] => [];

/** Habits are the app's own, and it starts with none. */
export const seedHabits = (): Habit[] => [];
