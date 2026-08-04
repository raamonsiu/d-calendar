import { dayKey, fmtShortDate, fmtTime, isSameDay, startOfDay } from '@/lib/date';
import type { CalEvent, Calendar, Task } from '@/types';

export const visibleCalendarIds = (calendars: Calendar[]) =>
  new Set(calendars.filter((c) => c.visible).map((c) => c.id));

export function visibleEvents(events: CalEvent[], calendars: Calendar[]) {
  const ids = visibleCalendarIds(calendars);
  return events.filter((e) => ids.has(e.calendarId));
}

export function eventsForDay(events: CalEvent[], day: Date) {
  return events
    .filter((e) => isSameDay(new Date(e.start), day))
    .sort((a, b) => a.start - b.start);
}

/** Cuántos eventos visibles hay por día, para los puntos de semana y mes. */
export function countsByDay(events: CalEvent[]) {
  const map = new Map<string, number>();
  for (const e of events) {
    const key = dayKey(new Date(e.start));
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

/** Dos carriles (top 0 / 78) para los solapes, igual que el prototipo. */
export type LaidOutEvent = {
  event: CalEvent;
  lane: number;
  x: number;
  width: number;
  startLabel: string;
};

export function layoutDay(
  events: CalEvent[],
  startHour: number,
  hourWidth: number,
  minWidth = 84,
): LaidOutEvent[] {
  const laneEnds: number[] = [];
  return events.map((event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const s = start.getHours() + start.getMinutes() / 60;
    const e = end.getHours() + end.getMinutes() / 60;

    let lane = laneEnds.findIndex((last) => last <= s);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = e;

    return {
      event,
      lane: lane % 2,
      x: (s - startHour) * hourWidth,
      width: Math.max(minWidth, (e - s) * hourWidth - 5),
      startLabel: fmtTime(start),
    };
  });
}

/** Meta que se ve a la derecha de la fila de tarea. */
export function taskMeta(task: Task): string {
  if (task.vagueMonth) {
    return task.vagueMonth === 'Sin mes'
      ? 'ALGÚN DÍA'
      : task.vagueMonth.slice(0, 3).toUpperCase();
  }
  if (task.due == null) return '';

  const due = new Date(task.due);
  const today = startOfDay(new Date());

  if (!task.done && task.due < Date.now() && !isSameDay(due, new Date()))
    return 'VENCE';

  if (isSameDay(due, today)) return task.hasTime ? fmtTime(due) : 'HOY';

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(due, tomorrow)) return 'MAÑANA';

  return fmtShortDate(due);
}

/** Las tareas de hoy y las vencidas, que son las que salen en la Home. */
export function todayTasks(tasks: Task[]) {
  const today = startOfDay(new Date());
  const endOfToday = today.getTime() + 86400000;
  return tasks.filter(
    (t) => t.due == null || t.vagueMonth != null || t.due < endOfToday,
  );
}
