import ICAL from 'ical.js';

import { untitledLabel } from '@/data/translations/domain';
import { MS_PER_DAY } from '@/lib/date';
import type { Language } from '@/lib/language';
import { SUBSCRIPTION_ID_PREFIX } from '@/lib/sourceIds';
import type { Availability, CalEvent, Visibility } from '@/types';

/**
 * Reading a calendar published as an `.ics` file (RFC 5545).
 *
 * Subscribing to a calendar by URL is nothing more than downloading this file
 * every so often and reading it again: there is no protocol, no handshake and
 * no push. The downloading belongs to `services`; this is the part that turns
 * the text into events, and it is pure, so it can be argued about without a
 * network.
 *
 * The parsing goes through `ical.js` rather than through a hand-written reader.
 * The format has more traps than it looks: lines fold at 75 characters and
 * continue with a space, values come escaped, a date arrives in four different
 * flavours, and a course timetable is almost entirely recurrence rules with
 * their exceptions. Each of those is a day of work and a month of edge cases.
 *
 * What is deliberately not read: the alarms (`VALARM`), which belong to whoever
 * published the calendar and not to this phone - the user can set their own on
 * any event and those are kept by the app - and the attendees, which say nothing
 * useful on a calendar nobody here was invited to.
 */

/**
 * Occurrences taken from a single repeating event, as a share of the window.
 *
 * A rule with no end repeats for ever, and the window is what normally stops
 * it; this stops the pathological cases, like a rule that repeats every minute.
 * One a day is the honest bound: a class that meets twice a day is two entries
 * with a rule each, not one rule firing twice, so anything denser than this is a
 * data feed rather than a calendar. Tying it to the window and not to a round
 * number is what keeps a daily event from stopping halfway through the year the
 * moment the window grows.
 */
const OCCURRENCES_PER_DAY = 1;

/**
 * Steps the expansion of one rule may take before giving up.
 *
 * It is not the same as the number kept: a daily event that started years ago
 * has to be walked from its first day to reach the window, and that walking is
 * cheap, but it cannot be unbounded. At one step a day this reaches some twenty
 * years back, which is further than any rule worth expanding was written.
 */
const MAX_STEPS = 8000;

/**
 * Events taken from a single calendar, whatever it holds.
 *
 * What is read gets stored, and the store is one entry in AsyncStorage with a
 * few megabytes to live in. An event of this app weighs a few hundred bytes as
 * JSON, so this is somewhere around a megabyte per subscribed calendar: room for
 * three years of a timetable that meets twenty times a week, and a stop for the
 * calendar that lists every train in the country.
 *
 * When it bites, what is lost is whatever came last in the file, which is not
 * the same as the furthest away in time. A calendar that reaches it is one this
 * app is the wrong reader for.
 */
const MAX_EVENTS = 4000;

/**
 * Turns the text of an `.ics` into events of the app.
 *
 * Repetitions are expanded here, one event per occurrence, which is the same
 * shape the calendars of the device arrive in: everything downstream draws a
 * list of events that happen once.
 *
 * Precondition: `text` is the body of an iCalendar file; a malformed one throws,
 * which the caller reads as "the download was no good". Postcondition: returns
 * only events that overlap the window, sorted by start; an event with no end is
 * given the length its `DURATION` says, or none, in which case it lasts an
 * instant.
 *
 * @param text Body of the `.ics` file.
 * @param calendarId Id of the subscribed calendar in the app's model.
 * @param from Start of the window being read.
 * @param to End of the window being read.
 * @param language Active language, for the stand-in title of an event that
 *   arrives without one.
 */
export function parseIcs(
  text: string,
  calendarId: string,
  from: Date,
  to: Date,
  language: Language,
): CalEvent[] {
  const calendar = new ICAL.Component(ICAL.parse(text));

  registerTimezones(calendar);

  const components = calendar.getAllSubcomponents('vevent');
  const events = relateExceptions(components);

  const found: CalEvent[] = [];
  const maxOccurrences = windowOccurrences(from, to);

  for (const event of events) {
    if (found.length >= MAX_EVENTS) break;

    if (event.isRecurring()) {
      collectOccurrences(
        event,
        calendarId,
        from,
        to,
        found,
        maxOccurrences,
        language,
      );
    } else {
      const single = toAppEvent(
        event,
        calendarId,
        event.startDate,
        event.endDate,
        language,
      );
      if (overlaps(single, from, to)) found.push(single);
    }
  }

  return found.sort((first, second) => first.startsAt - second.startsAt);
}

/**
 * How many occurrences of one rule the window has room for.
 *
 * Postcondition: at least 1, so a window shorter than a day still lets the
 * single occurrence inside it through.
 *
 * @param from Start of the window being read.
 * @param to End of the window being read.
 */
function windowOccurrences(from: Date, to: Date) {
  const days = Math.ceil((to.getTime() - from.getTime()) / MS_PER_DAY);
  return Math.max(1, days * OCCURRENCES_PER_DAY);
}

/**
 * Registers the time zones the file carries with it.
 *
 * This is what makes `TZID=Europe/Madrid` mean something without shipping a
 * database of the world's time zones: a well formed `.ics` brings the rules of
 * every zone it uses inside itself. One already known is left alone, because
 * the service is global and two files may name the same zone.
 *
 * @param calendar Root component of the file.
 */
function registerTimezones(calendar: ICAL.Component) {
  for (const zone of calendar.getAllSubcomponents('vtimezone')) {
    const timezone = new ICAL.Timezone(zone);
    if (!ICAL.TimezoneService.has(timezone.tzid)) {
      ICAL.TimezoneService.register(timezone);
    }
  }
}

/**
 * Separates the events that stand on their own from the ones that modify a
 * single occurrence of a repetition, and ties the second to the first.
 *
 * A `RECURRENCE-ID` says "that Tuesday's class was moved": without relating it,
 * the class appears twice, in the old slot and the new one.
 *
 * Postcondition: returns only the events that are expanded; the exceptions are
 * inside them and come out of the expansion in their place.
 *
 * @param components The `VEVENT` components of the file.
 */
function relateExceptions(components: ICAL.Component[]) {
  const masters = new Map<string, ICAL.Event>();
  const exceptions: ICAL.Event[] = [];

  for (const component of components) {
    const event = new ICAL.Event(component);
    if (event.isRecurrenceException()) exceptions.push(event);
    else if (event.uid) masters.set(event.uid, event);
  }

  for (const exception of exceptions) {
    const master = masters.get(exception.uid);
    if (master) master.relateException(exception);
  }

  return [...masters.values()];
}

/**
 * Walks a repeating event and keeps the occurrences that fall in the window.
 *
 * The expansion has to start where the rule does, not at the window: a weekly
 * rule anchored somewhere else would land on the wrong weekday. So the early
 * occurrences are walked past rather than skipped, which is what `MAX_STEPS`
 * bounds.
 *
 * Postcondition: appends to `found`; stops at the end of the window, at the
 * caps, or when the rule runs out.
 *
 * @param event Repeating event.
 * @param calendarId Id of the subscribed calendar in the app's model.
 * @param from Start of the window being read.
 * @param to End of the window being read.
 * @param found List the occurrences are appended to.
 * @param maxOccurrences Most this one rule may contribute; see
 * `OCCURRENCES_PER_DAY`.
 * @param language Active language, passed through to `toAppEvent`.
 */
function collectOccurrences(
  event: ICAL.Event,
  calendarId: string,
  from: Date,
  to: Date,
  found: CalEvent[],
  maxOccurrences: number,
  language: Language,
) {
  const expansion = event.iterator();
  let kept = 0;

  for (let step = 0; step < MAX_STEPS; step += 1) {
    const next = expansion.next();
    if (!next) break;
    if (next.toJSDate() > to) break;

    const occurrence = event.getOccurrenceDetails(next);
    const single = toAppEvent(
      occurrence.item,
      calendarId,
      occurrence.startDate,
      occurrence.endDate,
      language,
    );

    if (overlaps(single, from, to)) {
      found.push(single);
      kept += 1;
      if (kept >= maxOccurrences || found.length >= MAX_EVENTS) break;
    }
  }
}

/**
 * Whether an event falls inside the window at all.
 *
 * @param event Event already in the app's model.
 * @param from Start of the window.
 * @param to End of the window.
 */
function overlaps(event: CalEvent, from: Date, to: Date) {
  return event.endsAt >= from.getTime() && event.startsAt <= to.getTime();
}

/**
 * Turns one occurrence into an event of the app.
 *
 * Postcondition: the id carries the start as well, because every occurrence of
 * a repetition shares the same `UID`. `repeat` is always 'No': the repetition
 * has already been expanded, and what is left is a day in a calendar.
 *
 * @param event Event the texts are read from.
 * @param calendarId Id of the subscribed calendar in the app's model.
 * @param startDate Start of this occurrence.
 * @param endDate End of this occurrence.
 * @param language Active language, for an event with no `SUMMARY`.
 */
function toAppEvent(
  event: ICAL.Event,
  calendarId: string,
  startDate: ICAL.Time,
  endDate: ICAL.Time,
  language: Language,
): CalEvent {
  const startsAt = startDate.toJSDate().getTime();
  const endsAt = endDate.toJSDate().getTime();

  return {
    id: `${SUBSCRIPTION_ID_PREFIX}${calendarId}:${event.uid}:${startsAt}`,
    title: event.summary || untitledLabel(language),
    description: event.description ?? '',
    location: event.location ?? '',
    startsAt,
    endsAt: Math.max(endsAt, startsAt),
    allDay: startDate.isDate,
    calendarId,
    availability: toAvailability(event),
    visibility: toVisibility(event),
    repeat: 'No',
    weekdays: [],
    guests: [],
    reminders: [],
  };
}

/**
 * How the event shows up in the user's availability. `TRANSP` is the property
 * that says it, and anything but 'TRANSPARENT' counts as busy.
 *
 * @param event Event being read.
 */
function toAvailability(event: ICAL.Event): Availability {
  const transparency = event.component.getFirstPropertyValue('transp');
  return transparency === 'TRANSPARENT' ? 'Libre' : 'Ocupado';
}

/**
 * Who can see the event, in the three values of the app's model.
 *
 * Postcondition: 'CONFIDENTIAL' comes back as private, which is the closest the
 * app can express, and anything missing or unknown as the default.
 *
 * @param event Event being read.
 */
function toVisibility(event: ICAL.Event): Visibility {
  const access = event.component.getFirstPropertyValue('class');
  if (access === 'PUBLIC') return 'Público';
  if (access === 'PRIVATE' || access === 'CONFIDENTIAL') return 'Privado';
  return 'Predet.';
}
