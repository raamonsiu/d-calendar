import type { Language, WeekStart } from '@/theme/prefs';
import type {
  Availability,
  CalendarKind,
  GuestState,
  HabitFrequency,
  RepeatRule,
  Visibility,
} from '@/types';

/**
 * Display labels for the values the store persists as-is, in Spanish,
 * regardless of the active language.
 *
 * These values are data, not copy: `Availability`, `Visibility`, `RepeatRule`
 * and the rest are written to the store and compared against directly
 * (`event.availability === 'Ocupado'`), so they never change with the
 * language - only what gets rendered for them does. Kept apart from
 * `src/data/translations/*` namespaces `react-i18next`'s `t()` reads, because
 * two of these values contain characters `t()`'s dotted key lookup cannot
 * carry (`'Predet.'` has a literal dot; several others have spaces).
 */

export const AVAILABILITY_LABELS: Record<Language, Record<Availability, string>> = {
  es: { Ocupado: 'Ocupado', Libre: 'Libre' },
  en: { Ocupado: 'Busy', Libre: 'Free' },
  ca: { Ocupado: 'Ocupat', Libre: 'Lliure' },
};

export const VISIBILITY_LABELS: Record<Language, Record<Visibility, string>> = {
  es: { 'Predet.': 'Predet.', Privado: 'Privado', Público: 'Público' },
  en: { 'Predet.': 'Default', Privado: 'Private', Público: 'Public' },
  ca: { 'Predet.': 'Predet.', Privado: 'Privat', Público: 'Públic' },
};

export const REPEAT_RULE_LABELS: Record<Language, Record<RepeatRule, string>> = {
  es: {
    No: 'No',
    'Cada día': 'Cada día',
    'Días de la semana': 'Días de la semana',
    'Cada mes': 'Cada mes',
  },
  en: {
    No: 'No',
    'Cada día': 'Every day',
    'Días de la semana': 'Weekdays',
    'Cada mes': 'Every month',
  },
  ca: {
    No: 'No',
    'Cada día': 'Cada dia',
    'Días de la semana': 'Dies de la setmana',
    'Cada mes': 'Cada mes',
  },
};

export const HABIT_FREQUENCY_LABELS: Record<
  Language,
  Record<HabitFrequency, string>
> = {
  es: {
    Diario: 'Diario',
    Semanal: 'Semanal',
    'X por día': 'X por día',
    'X por semana': 'X por semana',
  },
  en: {
    Diario: 'Daily',
    Semanal: 'Weekly',
    'X por día': 'X per day',
    'X por semana': 'X per week',
  },
  ca: {
    Diario: 'Diari',
    Semanal: 'Setmanal',
    'X por día': 'X per dia',
    'X por semana': 'X per setmana',
  },
};

export const WEEK_START_LABELS: Record<Language, Record<WeekStart, string>> = {
  es: { Lunes: 'Lunes', Sábado: 'Sábado', Domingo: 'Domingo' },
  en: { Lunes: 'Monday', Sábado: 'Saturday', Domingo: 'Sunday' },
  ca: { Lunes: 'Dilluns', Sábado: 'Dissabte', Domingo: 'Diumenge' },
};

export const CALENDAR_KIND_LABELS: Record<Language, Record<CalendarKind, string>> = {
  es: { '': '', TAREAS: 'TAREAS', CALDAV: 'CALDAV', ICS: 'ICS' },
  en: { '': '', TAREAS: 'TASKS', CALDAV: 'CALDAV', ICS: 'ICS' },
  ca: { '': '', TAREAS: 'TASQUES', CALDAV: 'CALDAV', ICS: 'ICS' },
};

export const GUEST_STATE_LABELS: Record<Language, Record<GuestState, string>> = {
  es: { PENDIENTE: 'PENDIENTE', ACEPTADO: 'ACEPTADO', RECHAZADO: 'RECHAZADO' },
  en: { PENDIENTE: 'PENDING', ACEPTADO: 'ACCEPTED', RECHAZADO: 'DECLINED' },
  ca: { PENDIENTE: 'PENDENT', ACEPTADO: 'ACCEPTAT', RECHAZADO: 'REBUTJAT' },
};

/** Full weekday names, indexed by `getDay()` (0 = Sunday). */
export const WEEKDAY_LABELS: Record<Language, string[]> = {
  es: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ca: ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'],
};

/**
 * Weekday initials, indexed by `getDay()`. Kept apart from slicing
 * `WEEKDAY_LABELS`, because a single Spanish or English letter tells the days
 * apart well enough, but a single Catalan one does not (`Dilluns`, `Dimarts`,
 * `Dimecres`, `Dijous`, `Divendres` and `Diumenge` all start with `D`).
 */
export const WEEKDAY_INITIALS: Record<Language, string[]> = {
  es: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  ca: ['Dg', 'Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds'],
};

/** Full month names, indexed by `getMonth()` (0 = January). */
export const MONTH_LABELS: Record<Language, string[]> = {
  es: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ],
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  ca: [
    'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
    'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre',
  ],
};

/**
 * `Task.vagueMonth` when it carries no real month: the "Sin mes" option a
 * task's month chip offers alongside the five upcoming months.
 */
export const NO_MONTH_VALUE = 'Sin mes';

export const NO_MONTH_LABELS: Record<Language, string> = {
  es: 'Sin mes',
  en: 'No month',
  ca: 'Sense mes',
};

/**
 * Display name of a month stored (like every other domain value) as its
 * Spanish literal, in the active language.
 *
 * Precondition: `spanishMonth` is one of `MONTH_LABELS.es` or `NO_MONTH_VALUE`.
 *
 * @param spanishMonth Month name as stored - always Spanish.
 * @param language Active language.
 */
export function monthLabelFromSpanish(spanishMonth: string, language: Language) {
  if (spanishMonth === NO_MONTH_VALUE) return NO_MONTH_LABELS[language];
  const index = MONTH_LABELS.es.indexOf(spanishMonth);
  return index === -1 ? spanishMonth : MONTH_LABELS[language][index];
}

const UNTITLED_LABELS: Record<Language, string> = {
  es: 'Sin título',
  en: 'Untitled',
  ca: 'Sense títol',
};

/**
 * Stand-in title for an event that arrives without one, from a device
 * calendar or a subscription.
 *
 * It lives here and not behind `t()` because the two callers are a pure
 * parser and a service, neither of which can hold a hook. It is resolved when
 * the event is read, so a language changed afterwards reaches it on the next
 * read: immediately for the calendars of the device, which are re-read every
 * time the app comes back, and on the next download for a subscription.
 *
 * @param language Active language.
 */
export const untitledLabel = (language: Language) => UNTITLED_LABELS[language];

export const availabilityLabel = (value: Availability, language: Language) =>
  AVAILABILITY_LABELS[language][value];

export const visibilityLabel = (value: Visibility, language: Language) =>
  VISIBILITY_LABELS[language][value];

export const repeatRuleLabel = (value: RepeatRule, language: Language) =>
  REPEAT_RULE_LABELS[language][value];

export const weekStartLabel = (value: WeekStart, language: Language) =>
  WEEK_START_LABELS[language][value];

export const calendarKindLabel = (value: CalendarKind, language: Language) =>
  CALENDAR_KIND_LABELS[language][value];

export const guestStateLabel = (value: GuestState, language: Language) =>
  GUEST_STATE_LABELS[language][value];
