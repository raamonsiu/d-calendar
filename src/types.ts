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
  /** null = it hangs from no account: shared or subscribed. */
  accountId: string | null;
  visible: boolean;
  /**
   * The app does not write new items here: subscriptions, and for now every
   * calendar read from the device.
   */
  readOnly?: boolean;
  /**
   * The system allows changing the events already in it. It is not the opposite
   * of `readOnly`: a calendar of the device may perfectly well take changes to
   * its events while the app still refuses to create new ones in it.
   */
  allowsEditing?: boolean;
  /**
   * Address of whoever shared the calendar, when it is not the user's own. It
   * is what tells a colleague's calendar from a subscription, since neither of
   * them hangs from an account.
   */
  sharedBy?: string;
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
  /**
   * Where it happens, as plain text. It is not tied to any map or places
   * service: whatever the user writes, or whatever the device's calendar had.
   */
  location: string;
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
