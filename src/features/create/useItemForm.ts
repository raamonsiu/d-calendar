import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { toggleInList, withoutId } from '@/lib/collections';
import { MONTHS, withTime } from '@/lib/date';
import { isDeviceId } from '@/lib/deviceIds';
import { isMultiFrequency, isWeeklyFrequency } from '@/lib/habits';
import { avatarInitial } from '@/lib/text';
import {
  canEditDeviceEvent,
  deleteDeviceEvent,
  readDeviceGuests,
  updateDeviceEvent,
} from '@/services/deviceCalendars';
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

/** Approximate month label used when the task has no month at all. */
const NO_MONTH = 'Sin mes';

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
 * State of the whole form. It is grouped by item type so each block of the
 * interface only receives its own part.
 */
export type ItemFormState = ReturnType<typeof useItemForm>;

export function useItemForm(editing?: Editing) {
  const prefs = usePrefs();
  const toast = useToast();
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

  const isDeviceEvent = !!editedEvent && isDeviceId(editedEvent.id);
  const deviceEventId = isDeviceEvent ? editedEvent.id : null;

  /**
   * An event of the device that the user did not create is shown but not
   * changed. Being in a calendar of theirs is not the same as being theirs: a
   * colleague's invitation lands there and is still the colleague's event.
   */
  const readOnly = isDeviceEvent && !canEditDeviceEvent(editedEvent.id);

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
      if (active) setGuests(loaded);
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

  /**
   * Calendars that can be written to: neither subscriptions nor the tasks one.
   */
  const writableCalendars = useMemo(
    () =>
      calendars.filter(
        (calendar) => !calendar.readOnly && calendar.kind !== 'TAREAS',
      ),
    [calendars],
  );

  /** The next five months plus "Sin mes". */
  const monthOptions = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const upcoming = Array.from(
      { length: VAGUE_MONTH_OPTIONS },
      (_, offset) => MONTHS[(currentMonth + offset) % MONTHS.length],
    );
    return [...upcoming, NO_MONTH];
  }, []);

  const canSave = title.trim().length > 0;

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
    calendarId,
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
      calendars.find((calendar) => calendar.kind === 'TAREAS')?.id ?? calendarId,
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
   */
  const saveToDevice = (id: string, payload: Omit<CalEvent, 'id'>) => {
    close();

    updateDeviceEvent(id, payload).then((saved) => {
      if (saved) useAppStore.getState().refresh();
      toast.show(saved ? 'Cambios guardados' : 'No se pudo guardar el cambio');
    });
  };

  /**
   * Saves the item and navigates back.
   *
   * On an event of the device that belongs to somebody else, the only thing
   * that gets saved is the reminders, which are the app's and not the event's.
   *
   * Precondition: does nothing when the title is empty, the same criterion that
   * disables the CTA. Postcondition: in edit mode it updates the item, in
   * create mode it adds a new one. Everything stays in the store: there is no
   * upload in this iteration.
   */
  const save = () => {
    if (!canSave) return;
    const store = useAppStore.getState();

    if (kind === 'event') {
      const payload = buildEvent();

      if (editing && isDeviceId(editing.item.id)) {
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
        saveToDevice(editing.item.id, payload);
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
   */
  const remove = () => {
    if (!editing) return;
    const store = useAppStore.getState();

    /**
     * There is no undo for an event of the device: it is gone from the phone
     * and from every other one syncing that account, so offering to bring it
     * back would be a promise the app cannot keep.
     */
    if (isDeviceId(editing.item.id)) {
      close();
      deleteDeviceEvent(editing.item.id).then((deleted) => {
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
    writableCalendars,

    event: {
      location,
      setLocation,
      startsAt,
      setStartsAt,
      endsAt,
      setEndsAt,
      allDay,
      setAllDay,
      repeat,
      setRepeat,
      weekdays: eventWeekdays,
      toggleWeekday: (day: number) =>
        setEventWeekdays((current) => toggleInList(current, day)),
      calendarId,
      setCalendarId,
      availability,
      setAvailability,
      visibility,
      setVisibility,
      guests,
      /**
       * The guest list of an event of the device is shown but not touched: the
       * app does not write attendees yet, and letting them be edited would
       * throw the change away without saying so.
       */
      guestsReadOnly: isDeviceEvent,
      addGuest: (name: string) =>
        setGuests((current) => [
          ...current,
          {
            id: createId('g'),
            name,
            initial: avatarInitial(name),
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
