/**
 * Reading the calendars the device already has.
 *
 * This is the app's way in to the events the user created somewhere else, in
 * Google Calendar, in Outlook or in the iPhone's calendar. It needs no OAuth
 * and no server: the operating system already syncs those accounts, so the
 * events are sitting in its calendar database and all that is left is reading
 * them.
 *
 * The only module that imports `expo-calendar`. Everything it returns is
 * already in the app's own model, so no screen ever sees a library type.
 *
 * It reads, it writes back changes to the events it read, and it creates new
 * ones: a calendar the system lets the app write to is offered in the form like
 * any other, and what the user creates there reaches their account and every
 * other device syncing it. The system is the one that decides, calendar by
 * calendar and event by event, what may be touched.
 */
import * as ExpoCalendar from 'expo-calendar';
import { Platform } from 'react-native';

import {
  accountOf,
  calendarDedupeKey,
  calendarPreference,
  placeCalendar,
  providerOf,
  type CalendarOrigin,
  type CalendarPlacement,
} from '@/lib/calendarSources';
import { calendarWindow } from '@/lib/calendarWindow';
import { MS_PER_DAY } from '@/lib/date';
import { fromDeviceId, toDeviceId } from '@/lib/sourceIds';
import { avatarInitial } from '@/lib/text';
import type {
  Account,
  Availability,
  CalEvent,
  Calendar,
  Guest,
  GuestState,
  RelativeReminder,
  ReminderUnit,
  RepeatRule,
  Visibility,
} from '@/types';

/** Calendars can only be read on the native targets. */
export const DEVICE_CALENDARS_SUPPORTED = Platform.OS !== 'web';

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 1440;

/** State of the calendar permission, mirroring the notifications one. */
export type CalendarPermission = 'granted' | 'denied' | 'undetermined';

/** Everything read in one pass, already in the app's model. */
export type DeviceCalendarData = {
  accounts: Account[];
  calendars: Calendar[];
  events: CalEvent[];
};

/**
 * The events of the last read, kept because everything done with one afterwards
 * — its guests, saving it, deleting it — goes through the object the system
 * handed over. It is a cache of that read and nothing else: whatever the
 * interface draws goes through the store.
 */
const readEvents = new Map<string, ExpoCalendar.ExpoCalendarEvent>();

/**
 * The calendars of the last read, kept for the same reason as the events:
 * creating one goes through the object the system handed over, which is the only
 * thing that can be written to.
 */
const readCalendars = new Map<string, ExpoCalendar.ExpoCalendar>();

/**
 * Ids of the events of the last read the user may change. It is worked out
 * while reading because that is where the accounts of the device are known, and
 * the question is precisely whether the event belongs to one of them.
 */
const editableEvents = new Set<string>();

/**
 * State of the permission, without ever prompting.
 *
 * Postcondition: 'undetermined' means the prompt has not been shown yet, and
 * 'denied' that only the system settings can undo it.
 */
export async function getCalendarPermission(): Promise<CalendarPermission> {
  if (!DEVICE_CALENDARS_SUPPORTED) return 'denied';

  const current = await ExpoCalendar.getCalendarPermissions();
  if (current.granted) return 'granted';
  return current.canAskAgain ? 'undetermined' : 'denied';
}

/**
 * Permission to read the calendars, prompting only the first time.
 *
 * Postcondition: returns true when they can be read. Once the user has said no,
 * this stops asking: the system only shows the prompt once.
 */
export async function ensureCalendarPermission() {
  if (!DEVICE_CALENDARS_SUPPORTED) return false;

  const current = await ExpoCalendar.getCalendarPermissions();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await ExpoCalendar.requestCalendarPermissions();
  return requested.granted;
}

/**
 * Turns the minutes an alarm fires before an event into the app's reminder.
 *
 * The app writes reminders as a value plus a unit, so a round number of days or
 * hours is expressed as such instead of as hundreds of minutes.
 *
 * Precondition: `alarm.relativeOffset` is in minutes and negative when the
 * alarm goes before the event, which is the normal case. Postcondition: returns
 * null for an alarm that fires after the event or at an absolute time, neither
 * of which the app's model can express.
 *
 * @param alarm Alarm as the device stores it.
 * @param index Position of the alarm, to build an id unique within its event.
 */
function toReminder(
  alarm: ExpoCalendar.Alarm,
  index: number,
): RelativeReminder | null {
  if (alarm.relativeOffset == null || alarm.relativeOffset > 0) return null;

  const minutes = Math.abs(Math.round(alarm.relativeOffset));
  const id = `alarm-${index}`;

  if (minutes > 0 && minutes % MINUTES_PER_DAY === 0) {
    return { id, value: minutes / MINUTES_PER_DAY, unit: 2 as ReminderUnit };
  }
  if (minutes > 0 && minutes % MINUTES_PER_HOUR === 0) {
    return { id, value: minutes / MINUTES_PER_HOUR, unit: 1 as ReminderUnit };
  }
  return { id, value: minutes, unit: 0 as ReminderUnit };
}

/**
 * Turns a reminder of the app into the alarm the device stores, the way back
 * from `toReminder`.
 *
 * Postcondition: the offset is negative, because every reminder the app can
 * express fires before the event.
 *
 * @param reminder Reminder as the app stores it.
 */
function toAlarm(reminder: RelativeReminder): ExpoCalendar.Alarm {
  const minutes =
    reminder.unit === 2
      ? reminder.value * MINUTES_PER_DAY
      : reminder.unit === 1
        ? reminder.value * MINUTES_PER_HOUR
        : reminder.value;

  return { relativeOffset: -minutes };
}

/**
 * Turns a device event into the app's own.
 *
 * Repetitions need no expanding here: the system is asked for a date range and
 * answers with the occurrences already separated, so every one of them arrives
 * as an event that happens once.
 *
 * Postcondition: the id carries the start time as well, because on a repeating
 * event every occurrence shares the same identifier.
 *
 * @param event Event as the device stores it.
 */
function toAppEvent(event: ExpoCalendar.ExpoCalendarEvent): CalEvent {
  const startsAt = new Date(event.startDate).getTime();
  const endsAt = new Date(event.endDate).getTime();

  return {
    id: toDeviceId(`${event.instanceId ?? event.id}:${startsAt}`),
    title: event.title || 'Sin título',
    description: event.notes ?? '',
    location: event.location ?? '',
    startsAt,
    endsAt,
    allDay: event.allDay,
    calendarId: toDeviceId(event.calendarId),
    availability: toAvailability(event.availability),
    visibility: toVisibility(event.accessLevel),
    /**
     * The system was asked for a date range and answered with the occurrences
     * already separated, so each one is an event that happens once. Whether it
     * belongs to a series is `recurrenceRule`, which the app reads to refuse to
     * edit it rather than to draw it.
     */
    repeat: 'No',
    weekdays: [],
    /**
     * Guests are not here: the system only hands them over one event at a time,
     * and asking for them while reading hundreds would make every read crawl.
     * `readDeviceGuests` fetches them when an event is opened.
     */
    guests: [],
    reminders: (event.alarms ?? [])
      .map(toReminder)
      .filter((reminder): reminder is RelativeReminder => reminder !== null),
  };
}

/**
 * How the event shows up in the user's availability.
 *
 * Postcondition: anything that is not explicitly free counts as busy, which is
 * what the two values of the app's model allow.
 *
 * @param availability Availability as the device stores it.
 */
function toAvailability(
  availability: ExpoCalendar.ExpoCalendarEvent['availability'],
): Availability {
  return availability === ExpoCalendar.Availability.FREE ? 'Libre' : 'Ocupado';
}

/**
 * How the event shows up in the user's availability, the way back from
 * `toAvailability`.
 *
 * @param availability Availability as the app stores it.
 */
function toDeviceAvailability(availability: Availability) {
  return availability === 'Libre'
    ? ExpoCalendar.Availability.FREE
    : ExpoCalendar.Availability.BUSY;
}

/**
 * Who can see the event, in the three values of the app's model.
 *
 * Postcondition: the system's 'confidential' comes back as private, which is
 * the closest the app can express, and anything unknown as the default.
 *
 * @param accessLevel Access level as the device stores it.
 */
function toVisibility(
  accessLevel: ExpoCalendar.ExpoCalendarEvent['accessLevel'],
): Visibility {
  if (accessLevel === ExpoCalendar.EventAccessLevel.PUBLIC) return 'Público';
  if (accessLevel === ExpoCalendar.EventAccessLevel.PRIVATE) return 'Privado';
  if (accessLevel === ExpoCalendar.EventAccessLevel.CONFIDENTIAL) {
    return 'Privado';
  }
  return 'Predet.';
}

/**
 * Turns the app's visibility into the access level the device stores, the way
 * back from `toVisibility`.
 *
 * Postcondition: 'Privado' comes out as private and never as confidential,
 * which is the value the round trip preserves.
 *
 * @param visibility Visibility as the app stores it.
 */
function toAccessLevel(visibility: Visibility) {
  if (visibility === 'Público') return ExpoCalendar.EventAccessLevel.PUBLIC;
  if (visibility === 'Privado') return ExpoCalendar.EventAccessLevel.PRIVATE;
  return ExpoCalendar.EventAccessLevel.DEFAULT;
}

/**
 * Repeat rules a calendar of the device can hold.
 *
 * Not every one of them survives the trip. What reaches Android is a rule made
 * of frequency, interval and end, and nothing else: the list of chosen weekdays
 * is dropped along the way, so a repetition on Tuesdays and Thursdays would
 * silently become a weekly one. Rather than let that happen it is not offered
 * there. iOS does take it.
 *
 * The form reads this to decide which chips to draw, so what cannot be written
 * is never asked for.
 */
export const DEVICE_REPEAT_RULES: RepeatRule[] =
  Platform.OS === 'ios'
    ? ['No', 'Cada día', 'Días de la semana', 'Cada mes']
    : ['No', 'Cada día', 'Cada mes'];

/**
 * Turns the app's repeat rule into the one the device stores.
 *
 * Precondition: `repeat` is one of `DEVICE_REPEAT_RULES`, which is what the
 * form offers when the destination is a calendar of the device. Postcondition:
 * returns null for an event that happens once, which is what the system reads
 * as "no repetition"; the rule it returns has no end, so the repetition goes on
 * for as long as the calendar it lives in does.
 *
 * @param repeat Repeat rule as the app stores it.
 * @param weekdays `getDay()` indexes, used only by the weekday rule.
 */
function toRecurrenceRule(
  repeat: RepeatRule,
  weekdays: number[],
): ExpoCalendar.RecurrenceRule | null {
  if (repeat === 'Cada día') {
    return { frequency: ExpoCalendar.Frequency.DAILY };
  }
  if (repeat === 'Cada mes') {
    return { frequency: ExpoCalendar.Frequency.MONTHLY };
  }
  if (repeat === 'Días de la semana' && weekdays.length > 0) {
    return {
      frequency: ExpoCalendar.Frequency.WEEKLY,
      /** The system counts from Sunday = 1, the app from Sunday = 0. */
      daysOfTheWeek: weekdays.map((weekday) => ({
        dayOfTheWeek: (weekday + 1) as ExpoCalendar.DayOfTheWeek,
      })),
    };
  }
  return null;
}

/**
 * Start and end of an event in the form the device keeps them.
 *
 * An all-day event is not a day of the user's time zone but a day of the
 * calendar, and Android says so plainly: it wants the two ends at midnight UTC,
 * with the event's zone set to UTC and the end on the following day. Handing it
 * local midnight instead moves the event a day whenever the phone is not on UTC,
 * which is most of the year here.
 *
 * That is an Android rule, and only Android gets it: on iOS EventKit works out
 * an all-day event from the calendar's own zone, and forcing UTC on it would be
 * the very mistake this avoids.
 *
 * Postcondition: for a timed event it returns the two instants untouched and no
 * zone, leaving the device's own. The end is always after the start.
 *
 * @param bounds When the event starts and ends, and whether it lasts all day.
 */
function deviceBounds(bounds: {
  startsAt: number;
  endsAt: number;
  allDay: boolean;
}): { startDate: Date; endDate: Date; timeZone?: string } {
  if (!bounds.allDay || Platform.OS !== 'android') {
    return {
      startDate: new Date(bounds.startsAt),
      endDate: new Date(bounds.endsAt),
    };
  }

  const firstDay = utcMidnight(bounds.startsAt);
  const lastDay = utcMidnight(bounds.endsAt);

  return {
    startDate: new Date(firstDay),
    endDate: new Date(Math.max(lastDay, firstDay) + MS_PER_DAY),
    timeZone: 'UTC',
  };
}

/**
 * Midnight UTC of the day an instant falls on, read in the phone's time zone.
 *
 * @param timestamp Instant in ms.
 */
function utcMidnight(timestamp: number) {
  const day = new Date(timestamp);
  return Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
}

/**
 * Turns an attendee of the device into a guest of the app.
 *
 * Postcondition: falls back to the address when the attendee has no name, which
 * is what the system reports for someone who is not in the contacts.
 *
 * @param attendee Attendee as the device stores it.
 */
function toGuest(attendee: ExpoCalendar.ExpoCalendarAttendee): Guest {
  const name = attendee.name || attendee.email || 'Invitado';

  return {
    id: toDeviceId(attendee.id ?? name),
    name,
    initial: avatarInitial(name),
    state: toGuestState(attendee.status),
  };
}

/**
 * Whether a guest accepted, in the three values of the app's model.
 *
 * @param status Attendee status as the device stores it.
 */
function toGuestState(
  status: ExpoCalendar.ExpoCalendarAttendee['status'],
): GuestState {
  if (status === ExpoCalendar.AttendeeStatus.ACCEPTED) return 'ACEPTADO';
  if (status === ExpoCalendar.AttendeeStatus.DECLINED) return 'RECHAZADO';
  return 'PENDIENTE';
}

/**
 * Guests of one event, asked for only when it is opened.
 *
 * Postcondition: returns an empty list when the event is not from the last read
 * or the system refuses to answer, which is what an event with no guests looks
 * like anyway.
 *
 * @param id Id of the event in the app's model.
 */
export async function readDeviceGuests(id: string): Promise<Guest[]> {
  const event = readEvents.get(id);
  if (!event) return [];

  try {
    const attendees = await event.getAttendees();
    return attendees.map(toGuest);
  } catch {
    return [];
  }
}

/**
 * What a device calendar says about itself, in the shape the placement rules
 * read it.
 *
 * @param calendar Calendar as the device stores it.
 */
function originOf(calendar: ExpoCalendar.ExpoCalendar): CalendarOrigin {
  return {
    accountName: calendar.source?.name ?? '',
    accountType: String(calendar.source?.type ?? ''),
    ownerAccount: calendar.ownerAccount ?? '',
    internalName: calendar.name ?? '',
  };
}

/**
 * Turns a device calendar into the app's own.
 *
 * Only the user's own calendars hang from an account. The ones someone shared
 * and the subscriptions have none, and the first are told from the second by
 * carrying who shared them.
 *
 * Postcondition: read only exactly when the system refuses writing, which is
 * what keeps a subscription of holidays out of the destination picker in the
 * form and lets the user's own calendar into it.
 *
 * @param calendar Calendar as the device stores it.
 * @param placement Where the rules put it.
 * @param accountId Id of its account, used only when it is the user's own.
 */
function toAppCalendar(
  calendar: ExpoCalendar.ExpoCalendar,
  placement: CalendarPlacement,
  accountId: string,
): Calendar {
  return {
    id: toDeviceId(calendar.id),
    name: calendar.title,
    dotColor: calendar.color ?? null,
    kind: '',
    accountId: placement === 'personal' ? accountId : null,
    /** Starts checked unless the system itself has it hidden. */
    visible: calendar.isVisible !== false,
    /**
     * The system decides. A calendar it does not let the app write to is not
     * offered as a destination, which is the case of every subscription and of
     * the calendars someone shared without giving away control.
     */
    readOnly: !calendar.allowsModifications,
    ...(placement === 'shared' && calendar.ownerAccount
      ? { sharedBy: calendar.ownerAccount }
      : {}),
  };
}

/**
 * Reads the accounts, the calendars and the events of the device.
 *
 * How far it looks is `calendarWindow`, shared with the subscribed calendars:
 * the two end up in the same lists, and a window that differed between them
 * would show one calendar ending where the other carries on.
 *
 * Precondition: none; the permission is checked here and the read is skipped
 * without it. Postcondition: returns null when there is no permission or the
 * platform has no calendars, which the caller reads as "leave what you had".
 *
 * @param now Instant the window is centred on.
 */
export async function readDeviceCalendarData(
  now: number,
): Promise<DeviceCalendarData | null> {
  if (!DEVICE_CALENDARS_SUPPORTED) return null;
  if (!(await ensureCalendarPermission())) return null;

  const deviceCalendars = await ExpoCalendar.getCalendars();
  if (deviceCalendars.length === 0) {
    return { accounts: [], calendars: [], events: [] };
  }

  /**
   * Every account the device syncs, which are all the user's. Knowing them all
   * before classifying anything is what keeps a calendar owned by one address
   * of theirs and synced through another from passing for someone else's.
   */
  const ownAccounts = new Set(
    deviceCalendars
      .map((calendar) => (calendar.source?.name ?? '').trim().toLowerCase())
      .filter(Boolean),
  );

  /**
   * The same subscription or shared calendar reaches the phone once per account
   * it was added to, and holiday calendars once per language on top of that.
   * Only the best copy of each is kept; the rest hold the same days and would
   * fill the menu with repeats.
   */
  const bestByKey = new Map<string, ExpoCalendar.ExpoCalendar>();
  const personal: ExpoCalendar.ExpoCalendar[] = [];

  for (const calendar of deviceCalendars) {
    const origin = originOf(calendar);

    if (placeCalendar(origin, ownAccounts) === 'personal') {
      personal.push(calendar);
      continue;
    }

    const key = calendarDedupeKey(origin, calendar.title);
    const rival = bestByKey.get(key);
    const isBetter =
      !rival ||
      calendarPreference(origin) > calendarPreference(originOf(rival));

    if (isBetter) bestByKey.set(key, calendar);
  }

  const kept = [...personal, ...bestByKey.values()];

  const accounts = new Map<string, Account>();
  const calendars: Calendar[] = [];
  const primaryIds = new Set<string>();

  readCalendars.clear();

  for (const calendar of kept) {
    readCalendars.set(toDeviceId(calendar.id), calendar);
    const origin = originOf(calendar);
    const placement = placeCalendar(origin, ownAccounts);
    const accountName =
      accountOf(origin, ownAccounts) || origin.ownerAccount || 'Dispositivo';
    const accountId = toDeviceId(accountName);

    /**
     * An account is only worth a section of its own when the user has calendars
     * in it: one that brings nothing but subscriptions would be an empty
     * heading.
     */
    if (placement === 'personal' && !accounts.has(accountId)) {
      accounts.set(accountId, {
        id: accountId,
        email: accountName,
        initial: avatarInitial(accountName),
        provider: providerOf(origin.accountType),
      });
    }

    if (calendar.isPrimary) primaryIds.add(toDeviceId(calendar.id));
    calendars.push(toAppCalendar(calendar, placement, accountId));
  }

  const { from, to } = calendarWindow(now);

  /**
   * Each calendar is asked separately, and on purpose: the loose `listEvents`
   * of the library hands back plain objects, while the method of a calendar
   * returns real events, the ones carrying `openInCalendar`, `getAttendees`,
   * `update` and `delete`. Everything the app does with an event after reading
   * it goes through those.
   *
   * Only the calendars that survived deduplication are asked: the copies that
   * were dropped would answer with the very same days. A calendar that fails
   * answers with nothing instead of bringing the whole read down with it.
   */
  const eventsByCalendar = await Promise.all(
    kept.map(async (calendar) => ({
      calendar,
      events: await calendar.listEvents(from, to).catch(() => []),
    })),
  );

  readEvents.clear();
  editableEvents.clear();

  const events: CalEvent[] = [];
  for (const { calendar, events: deviceEvents } of eventsByCalendar) {
    for (const deviceEvent of deviceEvents) {
      const event = toAppEvent(deviceEvent);
      readEvents.set(event.id, deviceEvent);
      if (isEditable(deviceEvent, calendar, ownAccounts)) {
        editableEvents.add(event.id);
      }
      events.push(event);
    }
  }

  logPlacements(
    deviceCalendars,
    ownAccounts,
    new Set(kept.map((calendar) => calendar.id)),
  );

  return {
    accounts: [...accounts.values()],
    calendars: sortForDisplay(calendars, primaryIds),
    events,
  };
}

/**
 * Order the calendars are drawn in: the main one of an account first, and the
 * rest by name.
 *
 * Postcondition: returns a new list; the input is not modified.
 *
 * @param calendars Calendars already in the app's model.
 * @param primaryIds Ids of the ones the system marks as primary.
 */
function sortForDisplay(calendars: Calendar[], primaryIds: Set<string>) {
  return [...calendars].sort((first, second) => {
    const firstIsPrimary = primaryIds.has(first.id);
    const secondIsPrimary = primaryIds.has(second.id);
    if (firstIsPrimary !== secondIsPrimary) return firstIsPrimary ? -1 : 1;
    return first.name.localeCompare(second.name, 'es');
  });
}

/**
 * Writes out how every calendar of the device was classified, while developing
 * only.
 *
 * The rules are guesses about what each system reports, and the only way to
 * tell whether they hold on a real phone is seeing what that phone said. It
 * costs one line per calendar in the Metro console and nothing in a release
 * build.
 *
 * Whether the system allows writing goes in the same line, because that is what
 * decides which calendars the form offers as a destination: a list that comes
 * out short is answered here.
 *
 * @param deviceCalendars Calendars as the device stores them.
 * @param ownAccounts Addresses of the accounts on the device.
 * @param keptIds Ids that survived deduplication.
 */
function logPlacements(
  deviceCalendars: ExpoCalendar.ExpoCalendar[],
  ownAccounts: ReadonlySet<string>,
  keptIds: ReadonlySet<string>,
) {
  if (!__DEV__) return;

  for (const calendar of deviceCalendars) {
    const origin = originOf(calendar);
    const placement = placeCalendar(origin, ownAccounts);
    const dropped = keptIds.has(calendar.id) ? '' : ' | DESCARTADO (repetido)';

    console.log(
      `[calendario] ${placement} | ${calendar.title}` +
        ` | escribible=${calendar.allowsModifications}` +
        ` | sección=${accountOf(origin, ownAccounts)}` +
        ` | cuenta=${origin.accountName} | dueño=${origin.ownerAccount}` +
        ` | tipo=${origin.accountType} | id=${origin.internalName}${dropped}`,
    );
  }
}

/**
 * Whether an event of the device can be changed from the app.
 *
 * Decided while reading, which is the only moment the accounts of the device
 * are all known, and looked up here.
 *
 * Postcondition: false for anything not from the last read, which is the safe
 * answer: it cannot be written either way.
 *
 * @param id Id of the event in the app's model.
 */
export const canEditDeviceEvent = (id: string) => editableEvents.has(id);

/**
 * Whether the user may change an event of the device.
 *
 * Three things have to hold, and the first is the one that matters: **the event
 * has to be theirs**. Being in a calendar of theirs is not the same thing — a
 * colleague's invitation lands in their own calendar and is still the
 * colleague's event — so what decides it is who organises it. An event with no
 * organiser is nobody else's, and counts as theirs.
 *
 * Then the system has to allow writing to the calendar at all, and the event
 * must not belong to a series: a repetition arrives already expanded into one
 * occurrence per day, and saving one of them would leave it unclear, to the
 * user and to the system, whether the change is for that day or for all of
 * them.
 *
 * @param event Event as the device stores it.
 * @param calendar Calendar it belongs to.
 * @param ownAddresses Addresses of the accounts on the device.
 */
function isEditable(
  event: ExpoCalendar.ExpoCalendarEvent,
  calendar: ExpoCalendar.ExpoCalendar,
  ownAddresses: ReadonlySet<string>,
) {
  const organiser = (event.organizerEmail ?? '').trim().toLowerCase();
  const isOwn = !organiser || ownAddresses.has(organiser);

  return isOwn && calendar.allowsModifications && !event.recurrenceRule;
}

/** The part of an event the app knows how to write back to the device. */
export type DeviceEventChanges = {
  title: string;
  description: string;
  location: string;
  startsAt: number;
  endsAt: number;
  allDay: boolean;
  availability: Availability;
};

/**
 * Everything the app knows how to write when it creates an event on the device.
 *
 * It is the editable part plus the two things that can only be decided when the
 * event is born: how it repeats, which the app refuses to change afterwards
 * because an occurrence does not know whether it speaks for its series, and the
 * visibility, which the library only accepts here and not on a save.
 */
export type DeviceEventDraft = DeviceEventChanges & {
  visibility: Visibility;
  repeat: RepeatRule;
  weekdays: number[];
  reminders: RelativeReminder[];
};

/**
 * The calendar an event is about to be created in.
 *
 * The cache of the last read answers almost always. It does not in the moment
 * right after a launch, before that read has finished, and asking the system by
 * id is what keeps a save from failing in that gap.
 *
 * Postcondition: returns null when the system does not know that id either,
 * which is what a calendar removed from the phone looks like.
 *
 * @param calendarId Id of the calendar in the app's model.
 */
async function destinationCalendar(calendarId: string) {
  const cached = readCalendars.get(calendarId);
  if (cached) return cached;

  try {
    return await ExpoCalendar.ExpoCalendar.get(fromDeviceId(calendarId));
  } catch {
    return null;
  }
}

/**
 * Creates an event in one of the calendars of the device.
 *
 * This is the only way anything the app makes leaves the phone: what is written
 * here reaches the account the calendar belongs to and, through it, every other
 * device and every other app the user opens that account in.
 *
 * The guests are not written, and neither is the app's own list of reminders
 * kept apart: the alarms travel with the event, so it is the calendar it now
 * lives in that announces it.
 *
 * Precondition: `calendarId` names a calendar that is not `readOnly`, which is
 * what the form offers. Postcondition: returns false when the system does not
 * know that calendar or refuses the write, and nothing is created. The new
 * event only shows up in the app after the next read.
 *
 * @param calendarId Id of the destination calendar in the app's model.
 * @param draft Event the form built.
 */
export async function createDeviceEvent(
  calendarId: string,
  draft: DeviceEventDraft,
) {
  const calendar = await destinationCalendar(calendarId);
  if (!calendar) return false;

  try {
    await calendar.createEvent({
      title: draft.title,
      notes: draft.description,
      location: draft.location,
      allDay: draft.allDay,
      ...deviceBounds(draft),
      availability: toDeviceAvailability(draft.availability),
      accessLevel: toAccessLevel(draft.visibility),
      recurrenceRule: toRecurrenceRule(draft.repeat, draft.weekdays),
      alarms: draft.reminders.map(toAlarm),
    });
    return true;
  } catch (error) {
    console.warn('No se pudo crear el evento en el calendario', error);
    return false;
  }
}

/**
 * Writes the changes of an event back to the calendar it came from.
 *
 * Only the fields the app can express are touched, so anything the system holds
 * and the model does not — the guests, the repetition — is left exactly as it
 * was instead of being wiped by omission.
 *
 * Precondition: `canEditDeviceEvent` said yes. Postcondition: returns false
 * when the event is no longer in the last read or the system refuses the
 * change, and nothing is written.
 *
 * @param id Id of the event in the app's model.
 * @param changes New values for the fields the app owns.
 */
export async function updateDeviceEvent(
  id: string,
  changes: DeviceEventChanges,
) {
  const event = readEvents.get(id);
  if (!event) return false;

  try {
    await event.update({
      title: changes.title,
      notes: changes.description,
      location: changes.location,
      allDay: changes.allDay,
      ...deviceBounds(changes),
      availability: toDeviceAvailability(changes.availability),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Deletes an event from the calendar it came from.
 *
 * Precondition: `canEditDeviceEvent` said yes. Postcondition: returns false
 * when the system refuses, and nothing is deleted. There is no undo: unlike the
 * app's own items, this one is gone from the device and from every phone
 * syncing that account.
 *
 * @param id Id of the event in the app's model.
 */
export async function deleteDeviceEvent(id: string) {
  const event = readEvents.get(id);
  if (!event) return false;

  try {
    await event.delete();
    readEvents.delete(id);
    return true;
  } catch {
    return false;
  }
}
