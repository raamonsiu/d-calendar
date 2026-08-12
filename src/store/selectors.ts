import {
  HOURS_PER_DAY,
  MS_PER_DAY,
  dayKey,
  decimalHours,
  formatShortDate,
  formatTime,
  isSameDay,
  startOfDay,
} from '@/lib/date';
import type { Account, CalEvent, Calendar, Task } from '@/types';

/**
 * Queries over the state. They are pure functions and live outside the store so
 * each screen can memoise them with `useMemo`: the store keeps the data, the
 * selectors decide what is shown.
 */

/** A calendar as the destination pickers draw it. */
export type CalendarOption = {
  id: string;
  name: string;
  dotColor: string | null;
  /** Second line: the account it hangs from, or who shared it. */
  hint: string;
};

/**
 * Calendars an item can be saved to: neither a subscription nor the tasks one,
 * nor one of the device the system keeps under lock.
 *
 * Postcondition: keeps the original order and does not modify the input list.
 *
 * @param calendars Every calendar in the store.
 */
export function writableCalendars(calendars: Calendar[]) {
  return calendars.filter(
    (calendar) => !calendar.readOnly && calendar.kind !== 'TAREAS',
  );
}

/**
 * Second line of a calendar in a destination list.
 *
 * Postcondition: never empty, so every row in the list has the same two lines.
 *
 * @param calendar Calendar being offered.
 * @param accounts Every account in the store, the device's among them.
 */
function calendarHint(calendar: Calendar, accounts: Account[]) {
  if (calendar.sharedBy) return `Compartido por ${calendar.sharedBy}`;

  const account = accounts.find(
    (candidate) => candidate.id === calendar.accountId,
  );
  return account ? account.email : 'En esta app';
}

/**
 * What a destination picker offers: the calendars that can be written to, plus
 * the one in use when that is not one of them, so an item living in somebody
 * else's calendar still shows where it is instead of nowhere.
 *
 * Each option carries the line that tells it apart, because with several
 * accounts on the phone the names repeat and "Trabajo" on its own does not say
 * where the item would land.
 *
 * Postcondition: the calendar in use is always in the list, and first when it
 * is not one of the writable ones.
 *
 * @param calendars Every calendar in the store.
 * @param accounts Every account in the store.
 * @param currentId Id of the calendar in use.
 */
export function calendarOptions(
  calendars: Calendar[],
  accounts: Account[],
  currentId: string,
): CalendarOption[] {
  const writable = writableCalendars(calendars);
  const current = calendars.find((calendar) => calendar.id === currentId);
  const offered =
    !current || writable.includes(current) ? writable : [current, ...writable];

  return offered.map((calendar) => ({
    id: calendar.id,
    name: calendar.name,
    dotColor: calendar.dotColor,
    hint: calendarHint(calendar, accounts),
  }));
}

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
 * Events of each day, grouped and sorted once.
 *
 * The views that scroll through days ask for one day at a time and would
 * otherwise walk the whole list per day drawn, which with a year of calendars
 * open is the difference between scrolling and stuttering.
 *
 * Postcondition: the key is the one from `dayKey`, every list is sorted by start
 * time, and days with no events are absent from the map, so the caller uses
 * `?? []`.
 *
 * @param events Events already filtered by visibility.
 */
export function eventsByDay(events: CalEvent[]) {
  const byDay = new Map<string, CalEvent[]>();

  for (const event of events) {
    const key = dayKey(new Date(event.startsAt));
    const sameDay = byDay.get(key);
    if (sameDay) sameDay.push(event);
    else byDay.set(key, [event]);
  }

  for (const sameDay of byDay.values()) {
    sameDay.sort((first, second) => first.startsAt - second.startsAt);
  }

  return byDay;
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

/**
 * Separates the events of a day into the ones that take the whole day and the
 * ones that happen at a time.
 *
 * An all-day event has no place on an hour grid. Laid out there it runs from
 * midnight to midnight and covers the day whole, hiding everything that really
 * does happen at an hour: the opposite of what it means, since an
 * event with no hour is precisely the one that does not occupy any.
 *
 * Postcondition: the two lists together hold every event given, in the order
 * they came in.
 *
 * @param events Events of one day.
 */
export function splitAllDay(events: CalEvent[]) {
  const allDay: CalEvent[] = [];
  const timed: CalEvent[] = [];

  for (const event of events) {
    if (event.allDay) allDay.push(event);
    else timed.push(event);
  }

  return { allDay, timed };
}

/** An event already placed on the hour rail, which runs left to right. */
export type LaidOutEvent = {
  event: CalEvent;
  /** 0 or 1: the design only allows two lanes for overlaps. */
  lane: number;
  left: number;
  width: number;
  startLabel: string;
};

/** An event already placed on a day column, which runs top to bottom. */
export type ColumnEvent = {
  event: CalEvent;
  top: number;
  height: number;
  left: number;
  width: number;
  startLabel: string;
};

/** The prototype stacks overlaps in two lanes and then starts over. */
const LANE_COUNT = 2;

/** Room between the end of a card and the edge of the next hour. */
const CARD_INSET = 5;

/** An event of a day with its hours resolved and its lane decided. */
type PlacedEvent = {
  event: CalEvent;
  lane: number;
  startsAtHour: number;
  endsAtHour: number;
  /** Whether another event of the same day runs at the same time. */
  overlapped: boolean;
};

/**
 * Works out, for the events of one day, which lane each goes in and which hours
 * it covers. It is the part the two layouts share; what changes between them is
 * only which axis those hours are turned into.
 *
 * Each event goes into the first lane that has already finished by its start
 * time; when every lane is busy, a new one is opened. The lane comes back modulo
 * `LANE_COUNT` because the design only has two.
 *
 * Precondition: `events` is sorted by start time, which is what `eventsByDay`
 * returns. Postcondition: one entry per event, in the same order, with
 * `endsAtHour` always greater than `startsAtHour`: an event that ends the next
 * day, midnight included, is cut at the end of this one, because that is as far
 * as the day being drawn goes.
 *
 * @param events Events of the day, sorted.
 */
function placeEvents(events: CalEvent[]): PlacedEvent[] {
  const laneEndHours: number[] = [];

  const placed = events.map((event) => {
    const startsAtHour = decimalHours(new Date(event.startsAt));
    const endOfEvent = decimalHours(new Date(event.endsAt));
    const endsAtHour =
      endOfEvent > startsAtHour ? endOfEvent : HOURS_PER_DAY;

    let lane = laneEndHours.findIndex((endHour) => endHour <= startsAtHour);
    if (lane === -1) lane = laneEndHours.length;
    laneEndHours[lane] = endsAtHour;

    return { event, lane: lane % LANE_COUNT, startsAtHour, endsAtHour };
  });

  return placed.map((candidate, index) => ({
    ...candidate,
    overlapped: placed.some(
      (other, otherIndex) =>
        otherIndex !== index &&
        other.startsAtHour < candidate.endsAtHour &&
        candidate.startsAtHour < other.endsAtHour,
    ),
  }));
}

/**
 * Places the events of a day on the hour rail, where an hour is a width.
 *
 * Precondition: as in `placeEvents`; `hourWidth` is the width of one hour in px.
 * Postcondition: one entry per event, in the same order, with `left` measured
 * from midnight and a width of at least `minWidth`.
 *
 * @param events Events of the day, sorted.
 * @param hourWidth Width of one hour in px.
 * @param minWidth Minimum card width for the title to fit.
 */
export function layoutDay(
  events: CalEvent[],
  hourWidth: number,
  minWidth = 84,
): LaidOutEvent[] {
  return placeEvents(events).map(
    ({ event, lane, startsAtHour, endsAtHour }) => ({
      event,
      lane,
      left: startsAtHour * hourWidth,
      width: Math.max(
        minWidth,
        (endsAtHour - startsAtHour) * hourWidth - CARD_INSET,
      ),
      startLabel: formatTime(new Date(event.startsAt)),
    }),
  );
}

/**
 * Places the events of a day on a column, where an hour is a height.
 *
 * This is the shape a calendar is usually read in, and it lets a card be as tall
 * as the event lasts. Two events at the same time share the width; an event with
 * nothing on top of it takes the column whole, which is what keeps a normal day
 * from being drawn in half the room available.
 *
 * Precondition: as in `placeEvents`. Postcondition: one entry per event, in the
 * same order, with `top` measured from midnight and a height of at least
 * `minHeight`, so a fifteen-minute event is still readable.
 *
 * @param events Events of the day, sorted.
 * @param hourHeight Height of one hour in px.
 * @param columnWidth Width of the day column in px.
 * @param minHeight Minimum card height for the title to fit.
 */
export function layoutDayColumn(
  events: CalEvent[],
  hourHeight: number,
  columnWidth: number,
  minHeight = 30,
): ColumnEvent[] {
  return placeEvents(events).map(
    ({ event, lane, startsAtHour, endsAtHour, overlapped }) => {
      const laneWidth = overlapped ? columnWidth / LANE_COUNT : columnWidth;

      return {
        event,
        top: startsAtHour * hourHeight,
        height: Math.max(
          minHeight,
          (endsAtHour - startsAtHour) * hourHeight - CARD_INSET,
        ),
        left: overlapped ? lane * laneWidth : 0,
        width: laneWidth - CARD_INSET,
        startLabel: formatTime(new Date(event.startsAt)),
      };
    },
  );
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
