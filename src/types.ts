export type ItemKind = 'event' | 'task' | 'habit';

export type Provider = 'GOOGLE' | 'ICLOUD' | 'OUTLOOK' | 'CALDAV' | 'ICS';

export type Account = {
  id: string;
  email: string;
  initial: string;
  provider: Provider;
};

export type CalendarKind = '' | 'TAREAS' | 'CALDAV' | 'ICS';

export type Calendar = {
  id: string;
  name: string;
  /** Punto de color del calendario. `null` = usa el acento de la app. */
  dot: string | null;
  kind: CalendarKind;
  /** null = «Otros calendarios» (CalDAV / ICS suscritos). */
  accountId: string | null;
  visible: boolean;
  /** Los calendarios suscritos por URL son de solo lectura. */
  readOnly?: boolean;
};

/** Aviso relativo: n minutos/horas/días antes. */
export type RelUnit = 0 | 1 | 2;
export type RelReminder = { id: string; value: number; unit: RelUnit };

/** Aviso de hábito: una hora del día, "09:00". */
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
  /** Timestamps en ms. */
  start: number;
  end: number;
  allDay: boolean;
  calendarId: string;
  availability: Availability;
  visibility: Visibility;
  repeat: RepeatRule;
  /** Índices getDay() (0 = domingo) cuando repeat = 'Días de la semana'. */
  weekdays: number[];
  guests: Guest[];
  reminders: RelReminder[];
};

export type Task = {
  id: string;
  title: string;
  description: string;
  calendarId: string;
  /** Vencimiento exacto en ms, o null si no tiene fecha. */
  due: number | null;
  /** Si false, el vencimiento es solo el día (sin hora). */
  hasTime: boolean;
  /** «Mes aproximado» cuando no hay fecha exacta: 'Agosto' … 'Sin mes'. */
  vagueMonth: string | null;
  done: boolean;
  reminders: RelReminder[];
};

export type HabitFreq = 'Diario' | 'Semanal' | 'X por día' | 'X por semana';

export type Habit = {
  id: string;
  name: string;
  description: string;
  freq: HabitFreq;
  /** Repeticiones necesarias: 1 en diario/semanal, N en x-día/x-semana. */
  target: number;
  /** Índices getDay() en los hábitos semanales. */
  weekdays: number[];
  reminders: TimeReminder[];
  /** Repeticiones hechas en el periodo actual. */
  progress: number;
  streak: number;
};

export const isWeeklyFreq = (f: HabitFreq) =>
  f === 'Semanal' || f === 'X por semana';

export const isMultiFreq = (f: HabitFreq) =>
  f === 'X por día' || f === 'X por semana';

/** Etiqueta de frecuencia tal y como aparece en la tarjeta del hábito. */
export function habitFreqLabel(h: Pick<Habit, 'freq' | 'target'>) {
  switch (h.freq) {
    case 'Diario':
      return 'DIARIO';
    case 'Semanal':
      return 'SEM.';
    case 'X por día':
      return `${h.target}×/DÍA`;
    case 'X por semana':
      return `${h.target}×/SEM`;
  }
}

export const habitStreakUnit = (h: Pick<Habit, 'freq'>) =>
  isWeeklyFreq(h.freq) ? 'S' : 'D';
