/**
 * Which days an event is drawn on.
 *
 * Two things stand between an event as it is stored and the days a calendar
 * shows it on, and both are resolved here.
 *
 * A repetition is one event in the store and many days on screen. Only the
 * events of the app carry one: the device and the subscriptions hand their
 * repetitions over already expanded, one event per occurrence, so for those
 * this module has nothing to expand.
 *
 * And an event belongs to every day it touches, not only to the one it started
 * on: a night shift is on both days and a three day trip is on the three of
 * them. What the hour grids need is each of those days on its own, with the
 * hours it covers there, which is what `expandEvents` hands them.
 *
 * What it costs is memory, and it is bounded on purpose: a repetition is only
 * expanded as far as the window the views can reach, and no single event is
 * ever spread over more days than `MAX_EVENT_DAYS`. Everything here is pure and
 * works in local time, which is the time the grids are drawn in.
 */
import { MS_PER_DAY, addDays, startOfDay, withTime } from '@/lib/date';
import type { CalEvent } from '@/types';

/**
 * Most days a single event may be spread over.
 *
 * It guards against bad data rather than stating a rule of the product: an end
 * date that arrived corrupted would otherwise turn one event into a copy per
 * day until the end of the window. Longer than a year is not an event any
 * more.
 */
const MAX_EVENT_DAYS = 366;

/**
 * Whether a repeating event falls on a given day.
 *
 * Precondition: `event.repeat` is not 'No'. Postcondition: a weekly event with
 * no weekdays chosen falls on the weekday of its first occurrence, and a
 * monthly one simply does not happen in months that are too short.
 *
 * @param event Event whose rule is being read.
 * @param day Candidate day.
 * @param firstOccurrence First occurrence of the event.
 */
function repeatsOnDay(event: CalEvent, day: Date, firstOccurrence: Date) {
  if (event.repeat === 'Cada día') return true;
  if (event.repeat === 'Días de la semana') {
    const weekdays =
      event.weekdays.length > 0 ? event.weekdays : [firstOccurrence.getDay()];
    return weekdays.includes(day.getDay());
  }
  return day.getDate() === firstOccurrence.getDate();
}

/**
 * Instants an event happens at inside a window.
 *
 * Every occurrence keeps the time of day of the first one; only the day moves.
 *
 * Precondition: `from` is 1 or more and `to` is 1 or more; both are instants in
 * ms. Postcondition: returns them in ascending order, at most one per day, and
 * an empty list when the event does not reach the window.
 *
 * @param event Event to expand.
 * @param from Start of the window, inclusive.
 * @param to End of the window, inclusive.
 */
export function eventOccurrences(event: CalEvent, from: number, to: number) {
  if (event.repeat === 'No') {
    const withinWindow = event.startsAt >= from && event.startsAt <= to;
    return withinWindow ? [event.startsAt] : [];
  }

  const firstOccurrence = new Date(event.startsAt);
  const firstDay = startOfDay(new Date(Math.max(from, event.startsAt)));
  const dayCount = Math.ceil((to - firstDay.getTime()) / MS_PER_DAY);

  const occurrences: number[] = [];
  for (let dayOffset = 0; dayOffset <= dayCount; dayOffset += 1) {
    const day = addDays(firstDay, dayOffset);
    const instant = withTime(day, firstOccurrence).getTime();
    if (instant < from || instant > to) continue;
    if (repeatsOnDay(event, day, firstOccurrence)) occurrences.push(instant);
  }
  return occurrences;
}

/**
 * Last day an event is on.
 *
 * An end landing exactly on midnight belongs to the day before it. That is how
 * a calendar of the device stores a day with no hour - from midnight to
 * midnight of the next day - and what an `.ics` means by a `DTEND` carrying a
 * date and no time. Taken at face value it would put every all day event on
 * two days instead of one.
 *
 * Postcondition: never earlier than the day the event starts on, whatever the
 * end says, so an event whose end arrived broken is still drawn once.
 *
 * @param event Event being measured.
 */
function lastDayOf(event: CalEvent) {
  const firstDay = startOfDay(new Date(event.startsAt));
  if (event.endsAt <= event.startsAt) return firstDay;

  const endDay = startOfDay(new Date(event.endsAt));
  const lastDay =
    event.endsAt === endDay.getTime() ? addDays(endDay, -1) : endDay;

  return lastDay.getTime() > firstDay.getTime() ? lastDay : firstDay;
}

/**
 * One occurrence cut into the days it covers.
 *
 * Every piece carries the id of the event it came from, so tapping the second
 * day of a trip opens the trip, and the hours of the day it is drawn on, so
 * the layouts place it knowing none of this: a day in the middle runs from
 * midnight to midnight, which is what a whole day looks like to them.
 *
 * Midnight is asked of the calendar and not of the arithmetic, so on the two
 * days a year the clock changes a piece still runs from one midnight to the
 * next and not 24 hours.
 *
 * Postcondition: returns the event itself, and not a copy, when it takes a
 * single day, which is what almost everything in a calendar is. The pieces
 * come in ascending order and never number more than `MAX_EVENT_DAYS`.
 *
 * @param event Event to cut, already carrying the hours of the occurrence
 * being drawn.
 */
function daysOf(event: CalEvent): CalEvent[] {
  const firstDay = startOfDay(new Date(event.startsAt));
  const lastDay = lastDayOf(event);
  if (lastDay.getTime() === firstDay.getTime()) return [event];

  const pieces: CalEvent[] = [];
  for (let dayOffset = 0; dayOffset < MAX_EVENT_DAYS; dayOffset += 1) {
    const day = addDays(firstDay, dayOffset);
    if (day.getTime() > lastDay.getTime()) break;

    pieces.push({
      ...event,
      startsAt: Math.max(event.startsAt, day.getTime()),
      endsAt: Math.min(event.endsAt, addDays(day, 1).getTime()),
    });
  }
  return pieces;
}

/**
 * The event as one of its repetitions, lasting as long as the first one.
 *
 * How long it lasts is kept in ms and not in hours of the clock, because that
 * is what a meeting an hour long means; a repetition landing on a day the
 * clock changes therefore ends an hour off the wall clock, which is the same
 * trade every calendar makes.
 *
 * Postcondition: returns the event itself for the occurrence it already
 * carries, so an event that repeats but is only drawn once is never copied.
 *
 * @param event Event the occurrence belongs to.
 * @param startsAt Instant this occurrence starts at.
 */
function occurrenceAt(event: CalEvent, startsAt: number): CalEvent {
  if (startsAt === event.startsAt) return event;
  return {
    ...event,
    startsAt,
    endsAt: startsAt + Math.max(0, event.endsAt - event.startsAt),
  };
}

/**
 * The days one event is drawn on, inside the window.
 *
 * An event may be told to repeat more often than it lasts - two days long and
 * repeating every day, which the form allows - and then two of its occurrences
 * want the same day. Only the first one gets it: a day draws an event once,
 * and the occurrence already on screen is the one that started earlier.
 *
 * Postcondition: at most one piece per day, every one of them starting inside
 * the window, in ascending order. Nothing is counted for an event that is
 * drawn once, which is what an event of the device or of a subscription always
 * is.
 *
 * @param event Event to open out.
 * @param from First instant the views reach.
 * @param to Last instant the views reach.
 */
function daysDrawn(event: CalEvent, from: number, to: number): CalEvent[] {
  /**
   * How long the event lasts, which is how far back of the window its
   * occurrences have to be looked for: one that started before it may still be
   * running inside it.
   */
  const duration = Math.max(0, event.endsAt - event.startsAt);
  const starts =
    event.repeat === 'No'
      ? [event.startsAt]
      : eventOccurrences(event, Math.max(1, from - duration), to);

  /** Only an event drawn several times can ask for the same day twice. */
  const takenDays = starts.length > 1 ? new Set<number>() : null;
  const drawn: CalEvent[] = [];

  for (const startsAt of starts) {
    for (const piece of daysOf(occurrenceAt(event, startsAt))) {
      if (piece.startsAt < from || piece.startsAt > to) continue;

      if (takenDays) {
        const day = startOfDay(new Date(piece.startsAt)).getTime();
        if (takenDays.has(day)) continue;
        takenDays.add(day);
      }

      drawn.push(piece);
    }
  }

  return drawn;
}

/**
 * Every event as the days that draw it: repetitions expanded, and whatever
 * runs past midnight cut into a piece per day.
 *
 * The window is the one the views can reach. Expanding further would be
 * building days nobody can scroll to, and a repetition has no end of its own
 * to stop at.
 *
 * Precondition: `from` is 1 or more, is the first instant of a day and is
 * earlier than `to`; both are instants in ms, which is what `calendarWindow`
 * answers with. Postcondition: every piece starts inside the window - and a
 * piece starts on the day it is drawn on, so that is the same as saying no
 * piece falls on a day the views cannot reach. Each carries the id of the
 * event it came from and the hours of its own day, so grouping the result by
 * the day its start falls on puts every piece where it belongs. An event that
 * takes a single day and does not repeat comes back as the very object that
 * came in, and no day ever holds the same event twice. The order follows the
 * input, each event's days together and ascending.
 *
 * @param events Events already narrowed to the visible calendars.
 * @param from First instant the views reach.
 * @param to Last instant the views reach.
 */
export function expandEvents(
  events: CalEvent[],
  from: number,
  to: number,
): CalEvent[] {
  return events.flatMap((event) => daysDrawn(event, from, to));
}
