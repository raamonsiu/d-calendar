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
 * It reads, and it writes back changes to the events it read, but it creates
 * nothing: what the app makes itself stays in its own store, which is why every
 * calendar coming from here is marked `readOnly`. Whether an event already
 * there can be changed is a separate question, and the system is the one that
 * answers it.
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
import { toDeviceId } from '@/lib/deviceIds';
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
  Visibility,
} from '@/types';

/** Calendars can only be read on the native targets. */
export const DEVICE_CALENDARS_SUPPORTED = Platform.OS !== 'web';

/** How far back and forward the device is read, in days. */
const WINDOW_BEFORE_DAYS = 30;
const WINDOW_AFTER_DAYS = 60;

const MS_PER_DAY = 86400000;
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
 * Postcondition: always read only, because the app does not write to the
 * device's calendars; that is what keeps them out of the destination picker in
 * the form.
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
     * Always read only for now: the app does not create events on the device
     * yet, so no calendar of the device is offered as a destination.
     */
    readOnly: true,
    /**
     * Whether the system lets the events already in it be changed, which is
     * what separates a calendar of the user's own from one they were merely
     * shown.
     */
    allowsEditing: calendar.allowsModifications,
    ...(placement === 'shared' && calendar.ownerAccount
      ? { sharedBy: calendar.ownerAccount }
      : {}),
  };
}

/**
 * Reads the accounts, the calendars and the events of the device.
 *
 * The window is a month back and two months forward: enough for the month view
 * to be populated and for the reminder plan, without dragging in years of
 * history.
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

  for (const calendar of kept) {
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

  const from = new Date(now - WINDOW_BEFORE_DAYS * MS_PER_DAY);
  const to = new Date(now + WINDOW_AFTER_DAYS * MS_PER_DAY);

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
 * @param deviceCalendars Calendars as the device stores them.
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
 * Writes the changes of an event back to the calendar it came from.
 *
 * Only the fields the app can express are touched, so anything the system holds
 * and the model does not — the location, the guests, the repetition — is left
 * exactly as it was instead of being wiped by omission.
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
      startDate: new Date(changes.startsAt),
      endDate: new Date(changes.endsAt),
      allDay: changes.allDay,
      availability:
        changes.availability === 'Libre'
          ? ExpoCalendar.Availability.FREE
          : ExpoCalendar.Availability.BUSY,
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
