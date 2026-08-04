import {
  MS_PER_DAY,
  dayKey,
  decimalHours,
  formatShortDate,
  formatTime,
  isSameDay,
  startOfDay,
} from '@/lib/date';
import type { CalEvent, Calendar, Task } from '@/types';

/**
 * Queries over the state. They are pure functions and live outside the store so
 * each screen can memoise them with `useMemo`: the store keeps the data, the
 * selectors decide what is shown.
 */

/** Ids of the calendars checked in the side menu. */
const visibleCalendarIds = (calendars: Calendar[]) =>
  new Set(
    calendars.filter((calendar) => calendar.visible).map(({ id }) => id),
  );

/**
 * Events belonging to the checked calendars.
 *
 * Postcondition: keeps the original order and does not modify the input list.
 *
 * @param events Every event in the store.
 * @param calendars Every calendar in the store.
 */
export function visibleEvents(events: CalEvent[], calendars: Calendar[]) {
  const allowed = visibleCalendarIds(calendars);
  return events.filter((event) => allowed.has(event.calendarId));
}

/**
 * Events starting on a given day, from morning to night.
 *
 * Postcondition: returns a new list sorted by start time.
 *
 * @param events Events already filtered by visibility.
 * @param day Day being drawn.
 */
export function eventsForDay(events: CalEvent[], day: Date) {
  return events
    .filter((event) => isSameDay(new Date(event.startsAt), day))
    .sort((first, second) => first.startsAt - second.startsAt);
}

/**
 * How many events fall on each day, for the week and month dots.
 *
 * Postcondition: the key is the one from `dayKey`; days with no events are
 * absent from the map, so the caller uses `?? 0`.
 *
 * @param events Events already filtered by visibility.
 */
export function eventCountsByDay(events: CalEvent[]) {
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = dayKey(new Date(event.startsAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** An event already placed on the hour rail. */
export type LaidOutEvent = {
  event: CalEvent;
  /** 0 or 1: the design only allows two lanes for overlaps. */
  lane: number;
  left: number;
  width: number;
  startLabel: string;
};

/** The prototype stacks overlaps in two lanes and then starts over. */
const LANE_COUNT = 2;

/** Room between the end of a card and the edge of the next hour. */
const CARD_INSET = 5;

/**
 * Places the events of a day on the hour rail.
 *
 * Each event goes into the first lane that has already finished by its start
 * time; when every lane is busy, a new one is opened. The lane is returned
 * modulo `LANE_COUNT` because the design only has two heights.
 *
 * Precondition: `events` is sorted by start time (`eventsForDay` returns it
 * that way) and `hourWidth` is the width of one hour in px. Postcondition:
 * returns one entry per event, in the same order, with `left` measured from
 * `startHour` and a width of at least `minWidth`.
 *
 * @param events Events of the day, sorted.
 * @param startHour First hour drawn on the rail.
 * @param hourWidth Width of one hour in px.
 * @param minWidth Minimum card width for the title to fit.
 */
export function layoutDay(
  events: CalEvent[],
  startHour: number,
  hourWidth: number,
  minWidth = 84,
): LaidOutEvent[] {
  const laneEndHours: number[] = [];

  return events.map((event) => {
    const startsAtHour = decimalHours(new Date(event.startsAt));
    const endsAtHour = decimalHours(new Date(event.endsAt));

    let lane = laneEndHours.findIndex((endHour) => endHour <= startsAtHour);
    if (lane === -1) lane = laneEndHours.length;
    laneEndHours[lane] = endsAtHour;

    return {
      event,
      lane: lane % LANE_COUNT,
      left: (startsAtHour - startHour) * hourWidth,
      width: Math.max(
        minWidth,
        (endsAtHour - startsAtHour) * hourWidth - CARD_INSET,
      ),
      startLabel: formatTime(new Date(event.startsAt)),
    };
  });
}

/**
 * Due label shown on the right of a task row.
 *
 * Postcondition: returns an empty string when the task has neither a date nor
 * an approximate month, which is the case where the row draws nothing.
 *
 * @param task Task whose due date is being described.
 */
export function taskDueLabel(task: Task): string {
  if (task.vagueMonth) {
    return task.vagueMonth === 'Sin mes'
      ? 'ALGÚN DÍA'
      : task.vagueMonth.slice(0, 3).toUpperCase();
  }
  if (task.dueAt == null) return '';

  const dueAt = new Date(task.dueAt);
  const now = new Date();
  const today = startOfDay(now);

  const isOverdue =
    !task.done && task.dueAt < now.getTime() && !isSameDay(dueAt, now);
  if (isOverdue) return 'VENCE';

  if (isSameDay(dueAt, today)) return task.hasTime ? formatTime(dueAt) : 'HOY';

  const tomorrow = new Date(today.getTime() + MS_PER_DAY);
  if (isSameDay(dueAt, tomorrow)) return 'MAÑANA';

  return formatShortDate(dueAt);
}

/**
 * Tasks that show up on Home: today's, the overdue ones and the ones without an
 * exact date. Later ones are left out so the list does not grow.
 *
 * Postcondition: returns a new list keeping the store order.
 *
 * @param tasks Every task in the store.
 */
export function tasksForHome(tasks: Task[]) {
  const endOfToday = startOfDay(new Date()).getTime() + MS_PER_DAY;
  return tasks.filter(
    (task) =>
      task.dueAt == null ||
      task.vagueMonth != null ||
      task.dueAt < endOfToday,
  );
}
