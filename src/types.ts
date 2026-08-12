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
   * The app does not create items here, so it is not offered as a destination
   * in the form: subscriptions, and the calendars of the device the system
   * refuses to let it write to.
   */
  readOnly?: boolean;
  /**
   * Address of whoever shared the calendar, when it is not the user's own. It
   * is what tells a colleague's calendar from a subscription, since neither of
   * them hangs from an account.
   */
  sharedBy?: string;
  /**
   * Whether an event created here can carry guests that really get invited.
   *
   * Only a calendar of the device can, and only when the account syncing it
   * takes attendees: writing one into a calendar that does not would leave the
   * guest sitting on the phone, told nothing.
   */
  canInvite?: boolean;
  /**
   * Where a subscribed calendar is downloaded from. Only subscriptions carry
   * one, and it is what gets downloaded again on every refresh.
   */
  url?: string;
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
  /**
   * Address the invitation is sent to. Empty on a guest of a calendar that
   * invites nobody, which is the only case where a guest is just a name.
   */
  email: string;
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
  /**
   * One occurrence of a repeating event of the device.
   *
   * It is not `repeat`, and cannot be: the system hands over a repetition
   * already expanded into one event per day, and the real rule is often one the
   * app's four values cannot say. So `repeat` stays 'No' - this is a day in a
   * calendar - and this flag carries the only thing that matters afterwards,
   * which is that saving or deleting it has to ask what it applies to.
   */
  repeats?: boolean;
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
