import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  insertAt,
  patchById,
  withoutId,
} from '@/lib/collections';
import { nextHabitProgress, nextHabitStreak, isHabitDone } from '@/lib/habits';
import { avatarInitial } from '@/lib/text';
import { color } from '@/theme/tokens';
import type {
  Account,
  CalEvent,
  Calendar,
  Habit,
  ItemKind,
  Provider,
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
 * Bumping this throws away what is stored and starts from the seed again. The
 * seed is written relative to the day it first ran, so it ages: this is the way
 * to refresh the demo data without clearing the app by hand.
 */
const STORAGE_VERSION = 1;

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

/** How long the sync mock takes to "finish". */
const MOCK_REFRESH_MS = 1400;

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
};

type AppActions = {
  addEvent: (draft: Omit<CalEvent, 'id'>) => string;
  updateEvent: (id: string, patch: Partial<CalEvent>) => void;

  addTask: (draft: Omit<Task, 'id'>) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;

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
  connectAccount: (provider: Provider, email: string) => void;
  /** Removes the account and its calendars. Local items are kept. */
  disconnectAccount: (id: string) => void;
  subscribeCalendar: (name: string, kind: 'CALDAV' | 'ICS') => void;

  refresh: () => void;
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

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      accounts: ACCOUNTS,
      calendars: CALENDARS,
      events: seedEvents(),
      tasks: seedTasks(),
      habits: seedHabits(),
      lastSync: Date.now() - INITIAL_SYNC_AGE_MS,
      refreshing: false,
      hydrated: false,

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
            task.id === id ? { ...task, done: !task.done } : task,
          ),
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
          if (removed.kind === 'event') {
            return { events: insertAt(state.events, removed.index, removed.item) };
          }
          if (removed.kind === 'task') {
            return { tasks: insertAt(state.tasks, removed.index, removed.item) };
          }
          return { habits: insertAt(state.habits, removed.index, removed.item) };
        }),

      toggleCalendar: (id) =>
        set((state) => ({
          calendars: state.calendars.map((calendar) =>
            calendar.id === id
              ? { ...calendar, visible: !calendar.visible }
              : calendar,
          ),
        })),

      connectAccount: (provider, email) => {
        const accountId = createId('acc');
        const account: Account = {
          id: accountId,
          email,
          initial: avatarInitial(email),
          provider,
        };
        const calendar: Calendar = {
          id: createId('cal'),
          name: email.split('@')[0] || 'Calendario',
          dotColor: color.textMuted,
          kind: '',
          accountId,
          visible: true,
        };

        set((state) => ({
          accounts: [...state.accounts, account],
          calendars: [...state.calendars, calendar],
        }));
      },

      disconnectAccount: (id) =>
        set((state) => ({
          accounts: withoutId(state.accounts, id),
          calendars: state.calendars.filter(
            (calendar) => calendar.accountId !== id,
          ),
        })),

      subscribeCalendar: (name, kind) =>
        set((state) => ({
          calendars: [
            ...state.calendars,
            {
              id: createId('cal'),
              name,
              dotColor: color.textDisabled,
              kind,
              accountId: null,
              visible: true,
              readOnly: true,
            },
          ],
        })),

      /**
       * Sync mock: there is no network yet, only the momentary state the side
       * menu shows while it "refreshes".
       */
      refresh: () => {
        if (get().refreshing) return;
        set({ refreshing: true });
        setTimeout(
          () => set({ refreshing: false, lastSync: Date.now() }),
          MOCK_REFRESH_MS,
        );
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
       * `refreshing` and `hydrated` are left out on purpose: they only describe
       * what is going on right now. Restoring `refreshing` would show the side
       * menu syncing after a restart with nothing running, and restoring
       * `hydrated` would claim the state was read before reading it.
       */
      partialize: ({ accounts, calendars, events, tasks, habits, lastSync }) => ({
        accounts,
        calendars,
        events,
        tasks,
        habits,
        lastSync,
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
