import type { WeekStart } from '@/theme/prefs';

export const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const MONTHS_LOWER = MONTHS.map((m) => m.toLowerCase());

export const WEEKDAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

/** Iniciales del diseño, indexadas por getDay() (0 = domingo). */
const DOW_INITIAL = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

/** Índice getDay() del primer día de la semana según la preferencia. */
export function weekStartIndex(weekStart: WeekStart) {
  return weekStart === 'Lunes' ? 1 : weekStart === 'Sábado' ? 6 : 0;
}

/** Inicial del día que toca a una fecha concreta. */
export const dowInitial = (d: Date) => DOW_INITIAL[d.getDay()];

export function dowInitials(weekStart: WeekStart) {
  const s = weekStartIndex(weekStart);
  return Array.from({ length: 7 }, (_, i) => DOW_INITIAL[(s + i) % 7]);
}

export const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const addDays = (d: Date, n: number) => {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
};

export const addMonths = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth() + n, 1);

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const isToday = (d: Date) => isSameDay(d, new Date());

export function startOfWeek(d: Date, weekStart: WeekStart) {
  const s = weekStartIndex(weekStart);
  const diff = (d.getDay() - s + 7) % 7;
  return addDays(startOfDay(d), -diff);
}

export function weekDays(d: Date, weekStart: WeekStart) {
  const first = startOfWeek(d, weekStart);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

/** Número de semana ISO. */
export function isoWeek(date: Date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Celdas de un mes para la rejilla: null en los huecos previos al día 1.
 * El resto de huecos finales no se rellenan (la rejilla los deja vacíos).
 */
export function monthCells(
  year: number,
  month: number,
  weekStart: WeekStart,
): (Date | null)[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() - weekStartIndex(weekStart) + 7) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const out: (Date | null)[] = Array.from({ length: offset }, () => null);
  for (let d = 1; d <= days; d++) out.push(new Date(year, month, d));
  return out;
}

/** Las mismas celdas repartidas en filas de 7, rellenando la última con null. */
export function monthRows(
  year: number,
  month: number,
  weekStart: WeekStart,
): (Date | null)[][] {
  const cells = monthCells(year, month, weekStart);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const row = cells.slice(i, i + 7);
    while (row.length < 7) row.push(null);
    rows.push(row);
  }
  return rows;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "09:30" */
export const fmtTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Hora del día como decimal: 09:30 -> 9.5 */
export const decimalHours = (d: Date) =>
  d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;

/** "Miércoles 30 julio" */
export const fmtLongDate = (d: Date) =>
  `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS_LOWER[d.getMonth()]}`;

/** "Miércoles 30" — título de la Home en modo día. */
export const fmtDayTitle = (d: Date) => `${WEEKDAYS[d.getDay()]} ${d.getDate()}`;

/** "30 JUL" */
export const fmtShortDate = (d: Date) =>
  `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}`;

/** Clave estable de un día, para agrupar. */
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Combina el día de `day` con la hora de `time`. */
export function withTime(day: Date, time: Date) {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    time.getHours(),
    time.getMinutes(),
    0,
    0,
  );
}

/** "hace 4 min" en el formato en mayúsculas del drawer. */
export function fmtAgo(ts: number | null) {
  if (!ts) return 'NUNCA';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'AHORA';
  if (mins < 60) return `HACE ${mins} MIN`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `HACE ${hours} H`;
  return `HACE ${Math.floor(hours / 24)} D`;
}
