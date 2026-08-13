import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { insertAt, patchById, withoutId } from '@/lib/collections';
import { nextHabitProgress, nextHabitStreak, isHabitDone } from '@/lib/habits';
import { detectLanguage } from '@/lib/language';
import { isDeviceId } from '@/lib/sourceIds';
import { withoutExpiredTasks } from '@/lib/tasks';
import { color } from '@/theme/tokens';
import type {
  Account,
  CalEvent,
  Calendar,
  Habit,
  ItemKind,
  RelativeReminder,
  Task,
} from '@/types';
import { ACCOUNTS, CALENDARS, seedEvents, seedHabits, seedTasks } from './seed';

/**
 * State of the app. It is the only way in to the data: no screen reads or
 * writes on its own, so replacing this layer with real syncing does not touch
 * the interface.
 *
 * The data is still made up, but it no longer lives only in memory: it is
 * written to the device, so what the user creates survives closing the app, and
 * with it the reminders scheduled from it. Every action makes exactly one `set`
 * call, so an action never leaves the state half done.
 */

/** Key the state is stored under on the device. */
const STORAGE_KEY = 'dcalendar-state';

/**
 * Bumping this throws away what is stored and starts from the seed again, which
 * is the way to push a change in the seed onto a phone that already ran the
 * app.
 *
 * 2: the demo data is gone. Events now come from the calendars of the device,
 * and the made-up ones sat next to them pretending to be real.
 */
const STORAGE_VERSION = 2;

let idCounter = 0;

/**
 * Generates an id that is unique within the session.
 *
 * Postcondition: two calls never return the same value, not even within the
 * same millisecond, because the counter is part of the string too.
 *
 * @param prefix Prefix identifying the item type ('ev', 'task'...).
 */
export function createId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

/** Age of the last sync at startup, for the side menu. */
const INITIAL_SYNC_AGE_MS = 4 * 60 * 1000;

/** What is kept about a deleted item so it can be restored. */
export type RemovedItem =
  | { kind: 'event'; index: number; item: CalEvent }
  | { kind: 'task'; index: number; item: Task }
  | { kind: 'habit'; index: number; item: Habit };

type AppState = {
  accounts: Account[];
  calendars: Calendar[];
  events: CalEvent[];
  tasks: Task[];
  habits: Habit[];
  lastSync: number | null;
  refreshing: boolean;
  /** True once the stored state has been read; see `useStoreHydrated`. */
  hydrated: boolean;
  /**
   * Events read from the calendars of the device. They are kept apart from the
   * app's own and are not stored: they are a cache of something that already
   * lives somewhere else, and re-reading them is cheap.
   */
  deviceEvents: CalEvent[];
  /**
   * Events downloaded from the calendars subscribed by URL.
   *
   * Unlike the device's, these **are** stored. The device is asked again on
   * every launch and always answers; a server may not be there, and a timetable
   * that disappears on the underground would be worse than a stale one.
   */
  subscriptionEvents: CalEvent[];
  /** True while the subscribed calendars are being downloaded. */
  syncingSubscriptions: boolean;
  /**
   * Accounts of the device the user disconnected. Taking one out of the lists
   * is not enough, because the next read of the device would bring it straight
   * back: this is what makes the decision last.
   */
  ignoredAccounts: string[];
  /**
   * Reminders the user set on events of the device, by event id.
   *
   * A reminder belongs to the app and not to the event: it is this phone
   * deciding when to be told, so it applies just as well to an event somebody
   * else created and the app must not touch. It is kept here because the events
   * themselves are a cache that every read rebuilds, alarms included, and an
   * override written into them would be gone by the next one.
   */
  eventReminders: Record<string, RelativeReminder[]>;
};

type AppActions = {
  addEvent: (draft: Omit<CalEvent, 'id'>) => string;
  updateEvent: (id: string, patch: Partial<CalEvent>) => void;

  addTask: (draft: Omit<Task, 'id'>) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  /**
   * Drops tasks completed on an earlier day. Nothing schedules this at
   * midnight itself, so it is called again whenever the app comes back to
   * the foreground; see `useTaskCleanup`.
   */
  purgeExpiredTasks: () => void;

  addHabit: (draft: Omit<Habit, 'id'>) => string;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  /**
   * Adds or subtracts one repetition of a habit.
   *
   * Postcondition: returns true only when the habit becomes complete with this
   * tap, which is what triggers the card pulse and the haptic.
   */
  bumpHabit: (id: string, delta: 1 | -1) => boolean;

  /** Returns what undo needs, or null when the id did not exist. */
  removeItem: (kind: ItemKind, id: string) => RemovedItem | null;
  restoreItem: (removed: RemovedItem) => void;

  toggleCalendar: (id: string) => void;
  /**
   * Removes the account and its calendars. Local items are kept.
   *
   * An account of the device is also remembered as ignored, because it cannot
   * be removed from the phone from here: what the app can do is stop reading
   * it, and that has to survive the next read.
   */
  disconnectAccount: (id: string) => void;
  /** Reads the disconnected device accounts again. */
  restoreIgnoredAccounts: () => void;
  /**
   * Sets the reminders of an event of the device, which are the app's and not
   * the event's, so they can be changed even on one it may not edit.
   */
  setEventReminders: (eventId: string, reminders: RelativeReminder[]) => void;
  /**
   * Adds a calendar subscribed by URL. It arrives empty; the download that
   * fills it is set off by `useSubscriptionSync`.
   */
  subscribeCalendar: (name: string, url: string) => void;
  /** Removes a subscribed calendar together with everything downloaded for it. */
  removeSubscription: (id: string) => void;
  /**
   * Closes the download of one subscribed calendar, replacing its events.
   *
   * Only that calendar's are touched: the others may have failed, or may still
   * be on their way, and their events have to stay where they are.
   */
  finishSubscription: (calendarId: string, events: CalEvent[]) => void;
  setSyncingSubscriptions: (syncing: boolean) => void;

  /**
   * Closes a read of the device calendars, replacing the previous one.
   *
   * The user's checkboxes are respected: a calendar already known keeps whether
   * it was checked, because that is a decision of theirs and not something the
   * system reports. With `null`, which is what a read without permission
   * returns, everything is left as it was and only the syncing state is
   * cleared.
   */
  finishRefresh: (data: DeviceData | null) => void;

  refresh: () => void;
};

/** What one read of the device calendars brings in. */
export type DeviceData = {
  accounts: Account[];
  calendars: Calendar[];
  events: CalEvent[];
};

/**
 * Takes an item out of a list, remembering its position.
 *
 * This is the common part of the three deletions: the only thing that changes
 * between events, tasks and habits is the list being worked on.
 *
 * Postcondition: returns null when the id is not in the list. When it is,
 * `rest` is a new list without it and `index` is the position it held, which is
 * what `restoreItem` needs to put it back.
 *
 * @param list List to take the item out of.
 * @param id Id of the item being looked for.
 */
function extractById<Item extends { id: string }>(list: Item[], id: string) {
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return null;
  return { index, item: list[index], rest: withoutId(list, id) };
}

/**
 * Lays the reminders the user chose back over events that have just been read.
 *
 * Both the device and the subscriptions hand over events with whatever alarms
 * they carry, and both are replaced whole on every read. A reminder set here
 * belongs to the app, so it has to be put back on top afterwards or it would
 * last until the next read and no longer.
 *
 * Postcondition: returns a new list; events with no reminder of their own are
 * returned untouched, not copied.
 *
 * @param events Events as they were just read.
 * @param overrides Reminders the user set, by event id.
 */
function withReminders(
  events: CalEvent[],
  overrides: Record<string, RelativeReminder[]>,
) {
  return events.map((event) =>
    overrides[event.id] ? { ...event, reminders: overrides[event.id] } : event,
  );
}

/** Guessed once: both seed lists need the same "language at install" answer. */
const SEED_LANGUAGE = detectLanguage();

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      accounts: ACCOUNTS,
      calendars: CALENDARS,
      events: seedEvents(),
      tasks: seedTasks(SEED_LANGUAGE),
      habits: seedHabits(SEED_LANGUAGE),
      lastSync: Date.now() - INITIAL_SYNC_AGE_MS,
      refreshing: false,
      hydrated: false,
      deviceEvents: [],
      subscriptionEvents: [],
      syncingSubscriptions: false,
      ignoredAccounts: [],
      eventReminders: {},

      addEvent: (draft) => {
        const id = createId('ev');
        set((state) => ({ events: [...state.events, { ...draft, id }] }));
        return id;
      },
      updateEvent: (id, patch) =>
        set((state) => ({ events: patchById(state.events, id, patch) })),

      addTask: (draft) => {
        const id = createId('task');
        set((state) => ({ tasks: [...state.tasks, { ...draft, id }] }));
        return id;
      },
      updateTask: (id, patch) =>
        set((state) => ({ tasks: patchById(state.tasks, id, patch) })),
      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  done: !task.done,
                  doneAt: task.done ? null : Date.now(),
                }
              : task,
          ),
        })),
      purgeExpiredTasks: () =>
        set((state) => ({
          tasks: withoutExpiredTasks(state.tasks, Date.now()),
        })),

      addHabit: (draft) => {
        const id = createId('habit');
        set((state) => ({ habits: [...state.habits, { ...draft, id }] }));
        return id;
      },
      updateHabit: (id, patch) =>
        set((state) => ({ habits: patchById(state.habits, id, patch) })),

      bumpHabit: (id, delta) => {
        const habit = get().habits.find((candidate) => candidate.id === id);
        if (!habit) return false;

        const progress = nextHabitProgress(habit.progress, habit.target, delta);
        const wasDone = isHabitDone(habit);
        const isDone = progress >= habit.target;

        set((state) => ({
          habits: patchById(state.habits, id, {
            progress,
            streak: nextHabitStreak(habit.streak, wasDone, isDone),
          }),
        }));

        return isDone && !wasDone;
      },

      removeItem: (kind, id) => {
        const state = get();

        if (kind === 'event') {
          const removed = extractById(state.events, id);
          if (!removed) return null;
          set({ events: removed.rest });
          return { kind, index: removed.index, item: removed.item };
        }

        if (kind === 'task') {
          const removed = extractById(state.tasks, id);
          if (!removed) return null;
          set({ tasks: removed.rest });
          return { kind, index: removed.index, item: removed.item };
        }

        const removed = extractById(state.habits, id);
        if (!removed) return null;
        set({ habits: removed.rest });
        return { kind, index: removed.index, item: removed.item };
      },

      restoreItem: (removed) =>
        set((state) => {
          const { index } = removed;

          if (removed.kind === 'event') {
            return { events: insertAt(state.events, index, removed.item) };
          }
          if (removed.kind === 'task') {
            return { tasks: insertAt(state.tasks, index, removed.item) };
          }
          return { habits: insertAt(state.habits, index, removed.item) };
        }),

      toggleCalendar: (id) =>
        set((state) => ({
          calendars: state.calendars.map((calendar) =>
            calendar.id === id
              ? { ...calendar, visible: !calendar.visible }
              : calendar,
          ),
        })),

      disconnectAccount: (id) =>
        set((state) => ({
          accounts: withoutId(state.accounts, id),
          calendars: state.calendars.filter(
            (calendar) => calendar.accountId !== id,
          ),
          ignoredAccounts:
            isDeviceId(id) && !state.ignoredAccounts.includes(id)
              ? [...state.ignoredAccounts, id]
              : state.ignoredAccounts,
        })),

      /**
       * Empties the ignored list and asks for a read, which is what brings the
       * accounts and their calendars back.
       */
      restoreIgnoredAccounts: () =>
        set({ ignoredAccounts: [], refreshing: true }),

      setEventReminders: (eventId, reminders) =>
        set((state) => {
          const applied = { [eventId]: reminders };
          return {
            eventReminders: { ...state.eventReminders, ...applied },
            deviceEvents: withReminders(state.deviceEvents, applied),
            subscriptionEvents: withReminders(state.subscriptionEvents, applied),
          };
        }),

      subscribeCalendar: (name, url) =>
        set((state) => ({
          calendars: [
            ...state.calendars,
            {
              id: createId('cal'),
              name,
              dotColor: color.textDisabled,
              /** A file is an `.ics`; anything else is taken for a CalDAV. */
              kind: url.endsWith('.ics') ? 'ICS' : 'CALDAV',
              accountId: null,
              visible: true,
              readOnly: true,
              url,
            },
          ],
        })),

      removeSubscription: (id) =>
        set((state) => ({
          calendars: withoutId(state.calendars, id),
          subscriptionEvents: state.subscriptionEvents.filter(
            (event) => event.calendarId !== id,
          ),
        })),

      finishSubscription: (calendarId, events) =>
        set((state) => ({
          subscriptionEvents: [
            ...state.subscriptionEvents.filter(
              (event) => event.calendarId !== calendarId,
            ),
            ...withReminders(events, state.eventReminders),
          ],
        })),

      setSyncingSubscriptions: (syncing) =>
        set({ syncingSubscriptions: syncing }),

      finishRefresh: (data) =>
        set((state) => {
          if (!data) return { refreshing: false };

          const wasVisible = new Map(
            state.calendars.map((calendar) => [calendar.id, calendar.visible]),
          );

          /**
           * A disconnected account comes back from the system on every read, so
           * it is left out here. Its calendars go with it; the shared ones and
           * the subscriptions hang from no account and stay.
           */
          const ignored = new Set(state.ignoredAccounts);
          const accounts = data.accounts.filter(
            (account) => !ignored.has(account.id),
          );
          const calendars = data.calendars.filter(
            (calendar) =>
              calendar.accountId === null || !ignored.has(calendar.accountId),
          );

          return {
            accounts: [
              ...state.accounts.filter((account) => !isDeviceId(account.id)),
              ...accounts,
            ],
            calendars: [
              ...state.calendars.filter((calendar) => !isDeviceId(calendar.id)),
              ...calendars.map((calendar) => ({
                ...calendar,
                visible: wasVisible.get(calendar.id) ?? calendar.visible,
              })),
            ],
            deviceEvents: withReminders(data.events, state.eventReminders),
            refreshing: false,
            lastSync: Date.now(),
          };
        }),

      /**
       * Rereads the calendars of the device, which is the only syncing there
       * is: the app's own data never leaves the phone, so there is nothing else
       * to bring in.
       *
       * The read itself belongs to `services`, so what is left here is the
       * state the side menu shows while it happens. `finishRefresh` closes it.
       */
      refresh: () => {
        if (get().refreshing) return;
        set({ refreshing: true });
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      /**
       * Marks the state as read, whether something was stored or not: on a
       * fresh install there is nothing to restore and the seed is already the
       * right answer.
       */
      onRehydrateStorage: () => () => {
        useAppStore.setState({ hydrated: true });
      },
      /**
       * What is left out, and why. `refreshing`, `syncingSubscriptions` and
       * `hydrated` only describe what is going on right now: restoring them
       * would show the side menu syncing with nothing running, or claim the
       * state was read before reading it. And `deviceEvents` belongs to the
       * device, which is asked again on every launch and always answers.
       *
       * `subscriptionEvents` is stored, unlike those: it came from a server that
       * may not be reachable next time, and a timetable that vanishes without a
       * signal would be worse than one a few hours old.
       */
      partialize: ({
        accounts,
        calendars,
        events,
        tasks,
        habits,
        lastSync,
        subscriptionEvents,
        ignoredAccounts,
        eventReminders,
      }) => ({
        accounts,
        calendars,
        events,
        tasks,
        habits,
        lastSync,
        subscriptionEvents,
        ignoredAccounts,
        eventReminders,
      }),
    },
  ),
);

/**
 * Whether the stored state has already been read from the device.
 *
 * Reading it is asynchronous, so for an instant the store still holds the seed.
 * The navigation root waits on this before drawing anything: otherwise a
 * returning user would see the demo data flash by and be replaced by their own.
 */
export const useStoreHydrated = () => useAppStore((state) => state.hydrated);
