/**
 * Data model of the app. Types only: the habit domain logic lives in
 * `src/lib/habits.ts` and the queries in `src/store/selectors.ts`.
 *
 * Instants are stored as timestamps in ms because the store is flat, and that
 * way they can be compared and serialised without converting.
 */

export type ItemKind = 'event' | 'task' | 'habit';

export type Provider = 'GOOGLE' | 'ICLOUD' | 'OUTLOOK' | 'CALDAV' | 'ICS';

export type Account = {
  id: string;
  email: string;
  /** Letter of the round avatar. */
  initial: string;
  provider: Provider;
};

/** Label the calendar row shows on the right; '' = none. */
export type CalendarKind = '' | 'TAREAS' | 'CALDAV' | 'ICS';

export type Calendar = {
  id: string;
  name: string;
  /** Colour dot of the calendar. `null` = use the app accent. */
  dotColor: string | null;
  kind: CalendarKind;
  /** null = "Otros calendarios" (subscribed CalDAV / ICS). */
  accountId: string | null;
  visible: boolean;
  /** Calendars subscribed by URL are read only. */
  readOnly?: boolean;
};

/** Unit of a relative reminder: 0 minutes, 1 hours, 2 days. */
export type ReminderUnit = 0 | 1 | 2;

/** Event or task reminder: n minutes, hours or days before. */
export type RelativeReminder = {
  id: string;
  value: number;
  unit: ReminderUnit;
};

/** Habit reminder: a time of day in "09:00" format. */
export type TimeReminder = { id: string; time: string };

export type GuestState = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO';

export type Guest = {
  id: string;
  name: string;
  initial: string;
  state: GuestState;
};

export type Availability = 'Ocupado' | 'Libre';
export type Visibility = 'Predet.' | 'Privado' | 'Público';
export type RepeatRule = 'No' | 'Cada día' | 'Días de la semana' | 'Cada mes';

export type CalEvent = {
  id: string;
  title: string;
  description: string;
  startsAt: number;
  endsAt: number;
  allDay: boolean;
  calendarId: string;
  availability: Availability;
  visibility: Visibility;
  repeat: RepeatRule;
  /** `getDay()` indexes (0 = Sunday) when repeat = 'Días de la semana'. */
  weekdays: number[];
  guests: Guest[];
  reminders: RelativeReminder[];
};

export type Task = {
  id: string;
  title: string;
  description: string;
  calendarId: string;
  /** Exact due date in ms, or null when there is none. */
  dueAt: number | null;
  /** When false, the due date is the day only, with no time. */
  hasTime: boolean;
  /** Approximate month when there is no exact date: 'Agosto' ... 'Sin mes'. */
  vagueMonth: string | null;
  done: boolean;
  reminders: RelativeReminder[];
};

export type HabitFrequency = 'Diario' | 'Semanal' | 'X por día' | 'X por semana';

export type Habit = {
  id: string;
  name: string;
  description: string;
  frequency: HabitFrequency;
  /** Repetitions needed: 1 for daily and weekly, N for the "X por" ones. */
  target: number;
  /** `getDay()` indexes on weekly habits. */
  weekdays: number[];
  reminders: TimeReminder[];
  /** Repetitions done in the current period. */
  progress: number;
  streak: number;
};
