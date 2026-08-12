import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { toggleInList, withoutId } from '@/lib/collections';
import { MONTHS, withTime } from '@/lib/date';
import { isMultiFrequency, isWeeklyFrequency } from '@/lib/habits';
import { isDeviceId, isForeignId, isSubscriptionId } from '@/lib/sourceIds';
import { avatarInitial } from '@/lib/text';
import {
  DEVICE_DELETE_SCOPES,
  DEVICE_EDIT_SCOPES,
  DEVICE_REPEAT_RULES,
  DEVICE_SERIES_KEEPS_LENGTH,
  canEditDeviceEvent,
  createDeviceEvent,
  deleteDeviceEvent,
  readDeviceGuests,
  updateDeviceEvent,
  type DeviceCreateResult,
  type DeviceUpdateResult,
  type SeriesScope,
} from '@/services/deviceCalendars';
import { calendarOptions, writableCalendars } from '@/store/selectors';
import { createId, useAppStore } from '@/store/useAppStore';
import { usePrefs } from '@/theme/prefs';
import { useToast } from '@/ui/Toast';
import type {
  Availability,
  CalEvent,
  Guest,
  Habit,
  HabitFrequency,
  ItemKind,
  RelativeReminder,
  RepeatRule,
  Task,
  TimeReminder,
  Visibility,
} from '@/types';

/**
 * State and rules of the Crear form, which is the same one the item detail uses
 * in edit mode.
 *
 * It lives apart from the interface so screens only have to draw: what gets
 * saved, with which defaults, and what happens on delete is all decided here.
 */

/** Item being edited; without it the form creates a new one. */
export type Editing =
  | { kind: 'event'; item: CalEvent }
  | { kind: 'task'; item: Task }
  | { kind: 'habit'; item: Habit };

/** How many upcoming months are offered as a task's approximate month. */
const VAGUE_MONTH_OPTIONS = 5;

/**
 * Repeat rules of an event of the app. A calendar of the device takes fewer,
 * which is what `DEVICE_REPEAT_RULES` says.
 */
const REPEAT_RULES: RepeatRule[] = [
  'No',
  'Cada día',
  'Días de la semana',
  'Cada mes',
];

/** Approximate month label used when the task has no month at all. */
const NO_MONTH = 'Sin mes';

/**
 * What the CUÁNDO box says on one occurrence of a repetition of the device.
 *
 * Two independent facts, and neither is universal, so the line is built out of
 * them rather than written out: whether the save can be aimed at a single day,
 * and whether the length can be changed at all. Both come from `services`,
 * which is where knowing what each system allows belongs.
 */
const SERIES_NOTE = [
  DEVICE_EDIT_SCOPES.length === 1
    ? 'Este evento se repite y el cambio se aplica a todas las repeticiones.'
    : 'Este evento se repite: al guardar eliges a qué repeticiones afecta.',
  DEVICE_SERIES_KEEPS_LENGTH ? 'La duración se mantiene.' : null,
]
  .filter(Boolean)
  .join(' ');

/** Step the start time of a new event is rounded up to. */
const SLOT_MINUTES = 15;

/** Default due time of a new task. */
const DEFAULT_DUE_HOUR = 18;

/** Minimum event duration, so the end never lands before the start. */
const MIN_EVENT_MS = 60000;

/** Default repetitions and counter bounds of an "X por" habit. */
const DEFAULT_HABIT_COUNT = 3;
const MIN_HABIT_COUNT = 2;
const MAX_HABIT_COUNT = 10;

/** Reminder a new event or task comes with: 15 minutes before. */
const DEFAULT_RELATIVE_REMINDER = { value: 15, unit: 0 } as const;

/** Reminder a new habit comes with. */
const DEFAULT_HABIT_TIME = '09:00';

/**
 * Rounds the current time up to the next quarter of an hour, which is the start
 * time of a new event.
 *
 * Postcondition: returns an instant at or after now, with seconds at 0.
 */
function nextSlot() {
  const slot = new Date();
  slot.setMinutes(
    Math.ceil(slot.getMinutes() / SLOT_MINUTES) * SLOT_MINUTES,
    0,
    0,
  );
  return slot;
}

/**
 * What the guest list of an event can do, and the line explaining it.
 *
 * There are four answers and each one is a different promise, so they are
 * decided here rather than woven through the interface. A subscription, or a
 * device event that is not the user's to touch at all, shows the guests it
 * already has and sends them nowhere else — `notOwn` is what a save could not
 * reach anyway, not "came from the device", so it does not catch a device event
 * of the user's own along with them, which is the mistake this used to make: an
 * event created here with guests could not have a single one added back once
 * saved. A calendar of the device that takes attendees really does invite: the
 * account syncing it mails them. One that does not take them is not offered a
 * guest list at all, because writing one would leave the guest on the phone.
 * And a calendar of the app keeps the guest as a note, which is the one case
 * worth saying out loud.
 *
 * Postcondition: `note` is never null, so the block always says what will
 * happen.
 *
 * @param where Whether the event being edited is not the user's to save at
 * all, whether the destination is a calendar of the device, and whether that
 * calendar takes guests; see `Calendar.canInvite`.
 */
function guestRule(where: {
  notOwn: boolean;
  onDevice: boolean;
  canInvite: boolean;
}) {
  const { notOwn, onDevice, canInvite } = where;

  if (notOwn) {
    return {
      readOnly: true,
      note: 'Los invitados vienen del calendario y se cambian allí.',
    };
  }
  if (!onDevice) {
    return {
      readOnly: false,
      note: 'En un calendario de la app el invitado queda apuntado, pero no se le envía nada.',
    };
  }
  if (!canInvite) {
    return {
      readOnly: true,
      note: 'Este calendario no admite invitados desde la app.',
    };
  }
  return {
    readOnly: false,
    note: 'La invitación la envía la cuenta de este calendario.',
  };
}

/**
 * What the toast says after creating an event in a calendar of the device.
 *
 * A create that went through with a guest left out gets said out loud: the
 * event exists, so reporting a plain failure would be wrong, and reporting a
 * plain success would have the user believing somebody was invited who was not.
 *
 * @param result How the create went.
 * @param moved Whether the event was moved out of a calendar of the app.
 */
function createdMessage(result: DeviceCreateResult, moved: boolean) {
  if (!result.created) return 'No se pudo crear el evento';
  if (result.guestsFailed) return 'Evento creado, pero faltan invitados';
  return moved ? 'Evento movido' : 'Evento creado';
}

/**
 * What the toast says after saving an event of the device, guests included.
 *
 * @param result How the save went.
 */
function savedMessage(result: DeviceUpdateResult) {
  if (!result.saved) return 'No se pudo guardar el cambio';
  if (result.guestsFailed) return 'Cambios guardados, pero faltan invitados';
  return 'Cambios guardados';
}

/**
 * True when two lists hold the same values, order and duplicates aside.
 *
 * What Guardar can change is mostly a handful of scalars and a few lists whose
 * order carries no meaning of its own — the weekdays ticked, the guests
 * invited, the reminders set. Comparing those as ordered arrays would call an
 * edit that only reordered them a change, when nothing was actually saved
 * differently.
 *
 * @param a One list.
 * @param b The other.
 * @param key Turns a value into the string two equal values share.
 */
function sameMultiset<Value>(
  a: Value[],
  b: Value[],
  key: (value: Value) => string,
): boolean {
  if (a.length !== b.length) return false;

  const left = a.map(key).sort();
  const right = b.map(key).sort();
  return left.every((value, index) => value === right[index]);
}

const relativeReminderKey = (reminder: RelativeReminder) =>
  `${reminder.value}:${reminder.unit}`;
const timeReminderKey = (reminder: TimeReminder) => reminder.time;

/** What Guardar can change on an event, before and after; see `eventChanged`. */
type EventSnapshot = {
  title: string;
  description: string;
  location: string;
  startsAt: number;
  endsAt: number;
  allDay: boolean;
  repeat: RepeatRule;
  weekdays: number[];
  calendarId: string;
  availability: Availability;
  visibility: Visibility;
  guests: Guest[];
  reminders: RelativeReminder[];
};

/**
 * Whether an event differs from the state Guardar opened with.
 *
 * Every field Guardar can touch is compared, and nothing else needs to be:
 * a field the interface currently hides — the repeat chips on a repetition, the
 * visibility on a device event — cannot be reached by the user in the first
 * place, so `before` and `now` already agree on it and it never causes a false
 * positive.
 *
 * @param before Snapshot taken when the screen opened.
 * @param now Snapshot of the current state.
 */
function eventChanged(before: EventSnapshot, now: EventSnapshot) {
  return (
    now.title !== before.title ||
    now.description !== before.description ||
    now.location !== before.location ||
    now.startsAt !== before.startsAt ||
    now.endsAt !== before.endsAt ||
    now.allDay !== before.allDay ||
    now.repeat !== before.repeat ||
    now.calendarId !== before.calendarId ||
    now.availability !== before.availability ||
    now.visibility !== before.visibility ||
    !sameMultiset(now.weekdays, before.weekdays, String) ||
    !sameMultiset(now.guests, before.guests, (guest) => guest.id) ||
    !sameMultiset(now.reminders, before.reminders, relativeReminderKey)
  );
}

/** What Guardar can change on a task; see `taskChanged`. */
type TaskSnapshot = {
  title: string;
  description: string;
  dueAt: number | null;
  hasTime: boolean;
  vagueMonth: string | null;
  reminders: RelativeReminder[];
};

/**
 * Whether a task differs from the state Guardar opened with.
 *
 * @param before Snapshot taken when the screen opened.
 * @param now Snapshot of the current state.
 */
function taskChanged(before: TaskSnapshot, now: TaskSnapshot) {
  return (
    now.title !== before.title ||
    now.description !== before.description ||
    now.dueAt !== before.dueAt ||
    now.hasTime !== before.hasTime ||
    now.vagueMonth !== before.vagueMonth ||
    !sameMultiset(now.reminders, before.reminders, relativeReminderKey)
  );
}

/** What Guardar can change on a habit; see `habitChanged`. */
type HabitSnapshot = {
  name: string;
  description: string;
  frequency: HabitFrequency;
  target: number;
  weekdays: number[];
  reminders: TimeReminder[];
};

/**
 * Whether a habit differs from the state Guardar opened with.
 *
 * @param before Snapshot taken when the screen opened.
 * @param now Snapshot of the current state.
 */
function habitChanged(before: HabitSnapshot, now: HabitSnapshot) {
  return (
    now.name !== before.name ||
    now.description !== before.description ||
    now.frequency !== before.frequency ||
    now.target !== before.target ||
    !sameMultiset(now.weekdays, before.weekdays, String) ||
    !sameMultiset(now.reminders, before.reminders, timeReminderKey)
  );
}

/**
 * State of the whole form. It is grouped by item type so each block of the
 * interface only receives its own part.
 */
export type ItemFormState = ReturnType<typeof useItemForm>;

export function useItemForm(editing?: Editing) {
  const prefs = usePrefs();
  const toast = useToast();
  const accounts = useAppStore((state) => state.accounts);
  const calendars = useAppStore((state) => state.calendars);

  const [kind, setKind] = useState<ItemKind>(editing?.kind ?? 'event');

  const [title, setTitle] = useState(() => {
    if (!editing) return '';
    return editing.kind === 'habit' ? editing.item.name : editing.item.title;
  });
  const [description, setDescription] = useState(
    editing?.item.description ?? '',
  );

  const editedEvent = editing?.kind === 'event' ? editing.item : undefined;
  const editedTask = editing?.kind === 'task' ? editing.item : undefined;
  const editedHabit = editing?.kind === 'habit' ? editing.item : undefined;

  const [startsAt, setStartsAt] = useState(() =>
    editedEvent ? new Date(editedEvent.startsAt) : nextSlot(),
  );
  const [endsAt, setEndsAt] = useState(() =>
    editedEvent
      ? new Date(editedEvent.endsAt)
      : new Date(nextSlot().getTime() + prefs.defaultDuration * 60000),
  );
  const [location, setLocation] = useState(editedEvent?.location ?? '');
  const [allDay, setAllDay] = useState(editedEvent?.allDay ?? false);
  const [repeat, setRepeat] = useState<RepeatRule>(editedEvent?.repeat ?? 'No');
  const [eventWeekdays, setEventWeekdays] = useState<number[]>(
    editedEvent?.weekdays ?? [],
  );
  const [calendarId, setCalendarId] = useState(
    editedEvent?.calendarId ?? editedTask?.calendarId ?? prefs.defaultCalendarId,
  );
  const [availability, setAvailability] = useState<Availability>(
    editedEvent?.availability ?? 'Ocupado',
  );
  const [visibility, setVisibility] = useState<Visibility>(
    editedEvent?.visibility ?? 'Predet.',
  );
  const [guests, setGuests] = useState<Guest[]>(editedEvent?.guests ?? []);

  /**
   * Frozen the moment the screen opens, so Guardar has something fixed to
   * compare the current state against; see `isDirty` below. A prop that only
   * looks stable is not enough here — `editing.item` is the store's own object,
   * and a background sync refreshing it mid-edit would otherwise drag the
   * baseline along with it. `initialGuests` is kept apart from `initialEvent`
   * because it is the one part of the baseline that cannot be known yet at this
   * point: a device event's guests load after the screen has already opened.
   */
  const [initialEvent] = useState(editedEvent);
  const [initialTask] = useState(editedTask);
  const [initialHabit] = useState(editedHabit);
  const [initialGuests, setInitialGuests] = useState(
    editedEvent?.guests ?? [],
  );

  const isDeviceEvent = !!editedEvent && isDeviceId(editedEvent.id);
  const isSubscribedEvent = !!editedEvent && isSubscriptionId(editedEvent.id);
  const deviceEventId = isDeviceEvent ? editedEvent.id : null;

  /**
   * The event being edited is one occurrence of a repetition of the device, so
   * every save and every delete has to say what it applies to first.
   */
  const inSeries = isDeviceEvent && !!editedEvent.repeats;
  const endLocked = inSeries && DEVICE_SERIES_KEEPS_LENGTH;

  /**
   * Moves the start of the event, dragging the end along when the length is not
   * the user's to change.
   *
   * Postcondition: with the end locked the event keeps lasting exactly as long
   * as it did, which is the only shape a repetition of Android can be saved in.
   *
   * @param next New start.
   */
  const moveStart = (next: Date) => {
    if (endLocked) {
      const shift = next.getTime() - startsAt.getTime();
      setEndsAt(new Date(endsAt.getTime() + shift));
    }
    setStartsAt(next);
  };

  /**
   * Scope chosen in the sheet, and which action is waiting for it. Null means no
   * sheet is open, which is also the state of every event that does not repeat.
   */
  const [scopeAsked, setScopeAsked] = useState<'save' | 'remove' | null>(null);

  /**
   * An event of the device that the user did not create is shown but not
   * changed. Being in a calendar of theirs is not the same as being theirs: a
   * colleague's invitation lands there and is still the colleague's event.
   *
   * A subscribed one is never editable: it is a copy of a file on a server, and
   * a change here would last until the next download.
   */
  const readOnly =
    isSubscribedEvent || (isDeviceEvent && !canEditDeviceEvent(editedEvent.id));

  /**
   * An event of the device arrives without guests, because asking for them
   * while reading hundreds would make every read crawl. They are fetched when
   * one is opened, which is asking something outside React and so belongs in an
   * effect and not in the render.
   */
  useEffect(() => {
    if (!deviceEventId) return;

    let active = true;
    readDeviceGuests(deviceEventId).then((loaded) => {
      if (!active) return;
      setGuests(loaded);
      /**
       * The baseline moves with it: this load is the guest list settling into
       * what it already was, not an edit, and without this Guardar would light
       * up the moment it finished.
       */
      setInitialGuests(loaded);
    });

    return () => {
      active = false;
    };
  }, [deviceEventId]);

  const [vague, setVague] = useState(!!editedTask?.vagueMonth);
  const [dueAt, setDueAt] = useState(() =>
    editedTask?.dueAt
      ? new Date(editedTask.dueAt)
      : withTime(new Date(), new Date(0, 0, 0, DEFAULT_DUE_HOUR, 0)),
  );
  const [hasTime, setHasTime] = useState(editedTask?.hasTime ?? true);
  const [vagueMonth, setVagueMonth] = useState<string | null>(
    editedTask?.vagueMonth ?? null,
  );

  const [frequency, setFrequency] = useState<HabitFrequency>(
    editedHabit?.frequency ?? 'Diario',
  );
  const [habitCount, setHabitCount] = useState(
    editedHabit && isMultiFrequency(editedHabit.frequency)
      ? editedHabit.target
      : DEFAULT_HABIT_COUNT,
  );
  const [habitWeekdays, setHabitWeekdays] = useState<number[]>(
    editedHabit?.weekdays ?? [],
  );

  const [relativeReminders, setRelativeReminders] = useState<
    RelativeReminder[]
  >(
    editedEvent?.reminders ??
      editedTask?.reminders ?? [
        { id: createId('r'), ...DEFAULT_RELATIVE_REMINDER },
      ],
  );
  const [timeReminders, setTimeReminders] = useState<TimeReminder[]>(
    editedHabit?.reminders ?? [
      { id: createId('r'), time: DEFAULT_HABIT_TIME },
    ],
  );

  const writable = useMemo(() => writableCalendars(calendars), [calendars]);

  /**
   * Calendar the item is saved to.
   *
   * When creating, a destination that can no longer be written to falls back to
   * the first one that can: the default calendar is a preference, and the
   * calendar it names may be one the phone has stopped syncing. Saving into it
   * would produce an item nothing shows, because no calendar of that id is
   * checked in the side menu.
   */
  const targetCalendarId =
    editing || writable.some((calendar) => calendar.id === calendarId)
      ? calendarId
      : (writable[0]?.id ?? calendarId);

  const destinations = useMemo(
    () => calendarOptions(calendars, accounts, targetCalendarId),
    [accounts, calendars, targetCalendarId],
  );

  const selectedCalendar = destinations.find(
    (option) => option.id === targetCalendarId,
  );

  const targetCalendar = calendars.find(
    (calendar) => calendar.id === targetCalendarId,
  );
  const isDeviceTarget = isDeviceId(targetCalendarId);

  /**
   * Chooses the destination calendar.
   *
   * Moving the event to a calendar of the device may leave its repetition
   * unwritable there, and rather than save a different one it goes back to an
   * event that happens once.
   */
  const chooseCalendar = (id: string) => {
    setCalendarId(id);
    if (isDeviceId(id) && !DEVICE_REPEAT_RULES.includes(repeat)) {
      setRepeat('No');
    }
  };

  const guestRules = guestRule({
    /**
     * Not `isForeignId`: that would be true for every device event, including
     * an editable one of the user's own, and block guests on exactly the events
     * that should offer them. What a save cannot reach is a subscription, or a
     * device event `readOnly` above already ruled out — someone else's, or a
     * calendar the system will not let the app write to.
     */
    notOwn: isSubscribedEvent || (isDeviceEvent && readOnly),
    onDevice: isDeviceTarget,
    canInvite: !!targetCalendar?.canInvite,
  });

  /** The next five months plus "Sin mes". */
  const monthOptions = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const upcoming = Array.from(
      { length: VAGUE_MONTH_OPTIONS },
      (_, offset) => MONTHS[(currentMonth + offset) % MONTHS.length],
    );
    return [...upcoming, NO_MONTH];
  }, []);

  /** Goes back to the previous screen, or to Home when there is no history. */
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const buildEvent = (): Omit<CalEvent, 'id'> => ({
    title: title.trim(),
    description: description.trim(),
    location: location.trim(),
    startsAt: startsAt.getTime(),
    endsAt: Math.max(endsAt.getTime(), startsAt.getTime() + MIN_EVENT_MS),
    allDay,
    calendarId: targetCalendarId,
    availability,
    visibility,
    repeat,
    weekdays: repeat === 'Días de la semana' ? eventWeekdays : [],
    guests,
    reminders: relativeReminders,
  });

  const buildTask = (): Omit<Task, 'id'> => ({
    title: title.trim(),
    description: description.trim(),
    calendarId:
      calendars.find((calendar) => calendar.kind === 'TAREAS')?.id ??
      targetCalendarId,
    dueAt: vague ? null : dueAt.getTime(),
    hasTime: vague ? false : hasTime,
    vagueMonth: vague ? (vagueMonth ?? NO_MONTH) : null,
    done: editedTask?.done ?? false,
    reminders: relativeReminders,
  });

  const buildHabit = (): Omit<Habit, 'id'> => ({
    name: title.trim(),
    description: description.trim(),
    frequency,
    target: isMultiFrequency(frequency) ? habitCount : 1,
    weekdays: isWeeklyFrequency(frequency) ? habitWeekdays : [],
    reminders: timeReminders,
    progress: editedHabit?.progress ?? 0,
    streak: editedHabit?.streak ?? 0,
  });

  /**
   * Whether the item being edited differs from the one the screen opened with.
   * Creating something new is never "no changes" — there is nothing yet to
   * compare against — so this only applies in edit mode, and it is what stops
   * Guardar from writing back an event nobody touched.
   */
  const isDirty =
    !editing ||
    (kind === 'event'
      ? !initialEvent ||
        eventChanged(
          { ...initialEvent, guests: initialGuests },
          buildEvent(),
        )
      : kind === 'task'
        ? !initialTask || taskChanged(initialTask, buildTask())
        : !initialHabit || habitChanged(initialHabit, buildHabit()));

  const canSave = title.trim().length > 0 && isDirty;

  /**
   * Writes an event of the device back to the calendar it came from, and closes
   * either way.
   *
   * The store is not touched: the device is the source of truth for its own
   * events, so the way to see the change is to read it again, which `refresh`
   * sets off. A refusal is reported instead of being swallowed, because the
   * screen has already closed and the user would be left believing it saved.
   *
   * @param id Id of the event being edited.
   * @param payload What the form built.
   * @param scope What the save reaches when the event is part of a series.
   */
  const saveToDevice = (
    id: string,
    payload: Omit<CalEvent, 'id'>,
    scope: SeriesScope,
  ) => {
    close();

    updateDeviceEvent(id, payload, scope).then((result) => {
      if (result.saved) useAppStore.getState().refresh();
      toast.show(savedMessage(result));
    });
  };

  /**
   * Creates the event in a calendar of the device, and takes it out of the
   * store when it was living there.
   *
   * This is the one thing the app makes that leaves the phone: it lands in the
   * account the calendar belongs to and turns up in every other device and app
   * signed into it. The guests leave with it, and the account is the one that
   * mails them the invitation.
   *
   * Moving an event of the app to a calendar of the device is a create plus a
   * delete, because the two live in different places and there is nothing to
   * update; and it is not offered as undoable, since half of it already
   * happened outside the phone.
   *
   * @param payload What the form built, with a device calendar as destination.
   * @param movedFrom Id of the event of the app being moved, or null when it is
   * a new one.
   */
  const createOnDevice = (
    payload: Omit<CalEvent, 'id'>,
    movedFrom: string | null,
  ) => {
    close();

    createDeviceEvent(payload.calendarId, payload).then((result) => {
      const store = useAppStore.getState();

      if (result.created) {
        if (movedFrom) store.removeItem('event', movedFrom);
        store.refresh();
      }

      toast.show(createdMessage(result, movedFrom !== null));
    });
  };

  /**
   * Saves the item and navigates back.
   *
   * Where it ends up depends on the destination calendar. One of the app's own
   * keeps it in the store; one of the device gets it written there, which is the
   * only way anything created here leaves the phone. On an event of the device
   * that belongs to somebody else, the only thing that gets saved is the
   * reminders, which are the app's and not the event's.
   *
   * Precondition: does nothing when the title is empty, the same criterion that
   * disables the CTA. Postcondition: in edit mode it updates the item, in
   * create mode it adds a new one.
   *
   * @param scope What the save reaches when the event is one occurrence of a
   * repetition; the sheet is what asks for it.
   */
  const commitSave = (scope: SeriesScope) => {
    if (!canSave) return;
    const store = useAppStore.getState();

    if (kind === 'event') {
      const payload = buildEvent();

      if (editing && isForeignId(editing.item.id)) {
        /**
         * The reminders are the app's, so they are stored whatever the event
         * is; the rest only reaches the device when it belongs to the user.
         */
        store.setEventReminders(editing.item.id, relativeReminders);
        if (readOnly) {
          close();
          toast.show('Avisos guardados');
          return;
        }
        saveToDevice(editing.item.id, payload, scope);
        return;
      }

      if (isDeviceId(payload.calendarId)) {
        createOnDevice(payload, editing?.item.id ?? null);
        return;
      }

      if (editing) store.updateEvent(editing.item.id, payload);
      else store.addEvent(payload);
      toast.show(editing ? 'Cambios guardados' : 'Evento creado');
    } else if (kind === 'task') {
      const payload = buildTask();
      if (editing) store.updateTask(editing.item.id, payload);
      else store.addTask(payload);
      toast.show(editing ? 'Cambios guardados' : 'Tarea creada');
    } else {
      const payload = buildHabit();
      if (editing) store.updateHabit(editing.item.id, payload);
      else store.addHabit(payload);
      toast.show(editing ? 'Cambios guardados' : 'Hábito creado');
    }

    close();
  };

  /**
   * Deletes the item being edited and offers to undo it.
   *
   * Precondition: only meaningful in edit mode. Postcondition: always closes
   * the screen, and the undo toast survives that navigation because the toast
   * is mounted above the navigator.
   *
   * @param scope What the deletion reaches when the event is one occurrence of
   * a repetition.
   */
  const commitRemove = (scope: SeriesScope) => {
    if (!editing) return;
    const store = useAppStore.getState();

    /**
     * There is no undo for an event of the device: it is gone from the phone
     * and from every other one syncing that account, so offering to bring it
     * back would be a promise the app cannot keep.
     */
    if (isDeviceId(editing.item.id)) {
      close();
      deleteDeviceEvent(editing.item.id, scope).then((deleted) => {
        if (deleted) store.refresh();
        toast.show(deleted ? 'Evento eliminado' : 'No se pudo eliminar');
      });
      return;
    }

    const removed = store.removeItem(editing.kind, editing.item.id);
    close();
    if (removed) {
      toast.showUndo('Elemento eliminado', () => store.restoreItem(removed));
    }
  };

  /**
   * What Guardar and Eliminar do, which on a repetition is ask first.
   *
   * An event that happens once goes straight through, and so does one of
   * somebody else's, where the only thing being saved is the reminders and
   * there is nothing to ask about. Anything else opens the sheet, and the
   * answer arrives back through `chooseScope`.
   */
  const asksScope = inSeries && !readOnly;

  const save = () => {
    if (!canSave) return;
    if (asksScope) setScopeAsked('save');
    else commitSave('series');
  };

  const remove = () => {
    if (asksScope) setScopeAsked('remove');
    else commitRemove('series');
  };

  /**
   * Closes the scope sheet and runs whichever action opened it.
   *
   * @param scope What the user chose the action should reach.
   */
  const chooseScope = (scope: SeriesScope) => {
    const asked = scopeAsked;
    setScopeAsked(null);
    if (asked === 'save') commitSave(scope);
    if (asked === 'remove') commitRemove(scope);
  };

  return {
    isEditing: !!editing,
    /** The item is shown but cannot be changed; see `readOnly` above. */
    readOnly,
    kind,
    setKind,
    title,
    setTitle,
    description,
    setDescription,
    canSave,
    save,
    remove,
    close,
    /** What the destination picker offers, and the chosen one for its button. */
    calendarOptions: destinations,
    selectedCalendar,

    /**
     * The sheet asking what a save or a delete reaches. It is open only while an
     * action is waiting on the answer, and the scopes offered are the ones that
     * action can actually honour, which is not the same list for the two of
     * them.
     */
    series: {
      /** Whether this event will ask before saving or deleting at all. */
      asks: asksScope,
      asked: scopeAsked,
      scopes: scopeAsked === 'remove' ? DEVICE_DELETE_SCOPES : DEVICE_EDIT_SCOPES,
      choose: chooseScope,
      dismiss: () => setScopeAsked(null),
    },

    event: {
      location,
      setLocation,
      startsAt,
      setStartsAt: moveStart,
      endsAt,
      setEndsAt,
      /**
       * A repetition of the device keeps its length; `DEVICE_SERIES_KEEPS_LENGTH`
       * says why. The end is shown, and follows the start, but is not chosen.
       */
      endLocked,
      /** The whole box, when the event is one occurrence of a repetition. */
      seriesNote: inSeries ? SERIES_NOTE : null,
      allDay,
      setAllDay,
      repeat,
      setRepeat,
      /** Rules the destination calendar can hold; see `DEVICE_REPEAT_RULES`. */
      repeatOptions: isDeviceTarget ? DEVICE_REPEAT_RULES : REPEAT_RULES,
      /**
       * The chips are hidden on an event that already repeats. The app cannot
       * read the real rule — a class on Tuesdays and Thursdays is none of its
       * four values — so they would show 'No' on something that plainly is not,
       * and a save would throw the answer away. The line under the box says it
       * repeats; changing how is done in the calendar it came from.
       */
      repeatShown: !inSeries,
      weekdays: eventWeekdays,
      toggleWeekday: (day: number) =>
        setEventWeekdays((current) => toggleInList(current, day)),
      calendarId: targetCalendarId,
      setCalendarId: chooseCalendar,
      availability,
      setAvailability,
      visibility,
      setVisibility,
      /**
       * The visibility is only offered where it can be saved. On an event that
       * already lives in the device it cannot: the library takes it when the
       * event is created and never again, so the chips would be asking for
       * something a save would throw away.
       */
      visibilityShown: !isDeviceEvent && !isSubscribedEvent,
      guests,
      /**
       * Whether the list can be added to, and the line under it saying what
       * happens with what is in it. Both come from `guestRule`.
       */
      guestsReadOnly: guestRules.readOnly,
      guestsNote: guestRules.note,
      addGuest: (email: string) =>
        setGuests((current) => [
          ...current,
          {
            id: createId('g'),
            /**
             * The address doubles as the name: an invitation is sent to an
             * address, and whoever receives it is not in the phone's contacts
             * for the app to look a name up in.
             */
            name: email,
            email,
            initial: avatarInitial(email),
            state: 'PENDIENTE',
          },
        ]),
      removeGuest: (id: string) =>
        setGuests((current) => withoutId(current, id)),
    },

    task: {
      vague,
      setVague,
      dueAt,
      setDueAt,
      hasTime,
      setHasTime,
      vagueMonth,
      setVagueMonth,
      monthOptions,
    },

    habit: {
      frequency,
      setFrequency,
      count: habitCount,
      increment: () =>
        setHabitCount((current) => Math.min(MAX_HABIT_COUNT, current + 1)),
      decrement: () =>
        setHabitCount((current) => Math.max(MIN_HABIT_COUNT, current - 1)),
      weekdays: habitWeekdays,
      toggleWeekday: (day: number) =>
        setHabitWeekdays((current) => toggleInList(current, day)),
    },

    reminders: {
      relative: relativeReminders,
      setRelative: setRelativeReminders,
      times: timeReminders,
      setTimes: setTimeReminders,
    },
  };
}
