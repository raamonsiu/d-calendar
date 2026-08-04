import { create } from 'zustand';

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

let counter = 0;
export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

/** Lo que se guarda para poder deshacer un borrado. */
export type Removed =
  | { kind: 'event'; index: number; item: CalEvent }
  | { kind: 'task'; index: number; item: Task }
  | { kind: 'habit'; index: number; item: Habit };

type State = {
  accounts: Account[];
  calendars: Calendar[];
  events: CalEvent[];
  tasks: Task[];
  habits: Habit[];
  lastSync: number | null;
  refreshing: boolean;
};

type Actions = {
  addEvent: (draft: Omit<CalEvent, 'id'>) => string;
  updateEvent: (id: string, patch: Partial<CalEvent>) => void;

  addTask: (draft: Omit<Task, 'id'>) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;

  addHabit: (draft: Omit<Habit, 'id'>) => string;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  /**
   * +1 / −1 repetición. Al superar el objetivo con otro press vuelve a 0.
   * Devuelve true si con este toque el hábito queda completado.
   */
  bumpHabit: (id: string, delta: 1 | -1) => boolean;

  removeItem: (kind: ItemKind, id: string) => Removed | null;
  restoreItem: (removed: Removed) => void;

  toggleCalendar: (id: string) => void;
  connectAccount: (provider: Provider, email: string) => void;
  /** Quita la cuenta y sus calendarios. Los elementos locales se conservan. */
  disconnectAccount: (id: string) => void;
  subscribeCalendar: (name: string, kind: 'CALDAV' | 'ICS') => void;

  refresh: () => void;
};

export const useAppStore = create<State & Actions>()((set, get) => ({
  accounts: ACCOUNTS,
  calendars: CALENDARS,
  events: seedEvents(),
  tasks: seedTasks(),
  habits: seedHabits(),
  lastSync: Date.now() - 4 * 60 * 1000,
  refreshing: false,

  addEvent: (draft) => {
    const id = uid('ev');
    set((s) => ({ events: [...s.events, { ...draft, id }] }));
    return id;
  },
  updateEvent: (id, patch) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),

  addTask: (draft) => {
    const id = uid('task');
    set((s) => ({ tasks: [...s.tasks, { ...draft, id }] }));
    return id;
  },
  updateTask: (id, patch) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),
  toggleTask: (id) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    })),

  addHabit: (draft) => {
    const id = uid('habit');
    set((s) => ({ habits: [...s.habits, { ...draft, id }] }));
    return id;
  },
  updateHabit: (id, patch) =>
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    })),
  bumpHabit: (id, delta) => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) return false;

    const next =
      delta === 1
        ? habit.progress >= habit.target
          ? 0
          : habit.progress + 1
        : Math.max(0, habit.progress - 1);

    const wasDone = habit.progress >= habit.target;
    const isDone = next >= habit.target;

    set((s) => ({
      habits: s.habits.map((h) =>
        h.id === id
          ? {
              ...h,
              progress: next,
              // La racha sube al completar y baja al deshacer la última.
              streak: isDone && !wasDone ? h.streak + 1 : wasDone && !isDone ? Math.max(0, h.streak - 1) : h.streak,
            }
          : h,
      ),
    }));

    return isDone && !wasDone;
  },

  removeItem: (kind, id) => {
    const state = get();
    if (kind === 'event') {
      const index = state.events.findIndex((e) => e.id === id);
      if (index < 0) return null;
      const item = state.events[index];
      set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
      return { kind, index, item };
    }
    if (kind === 'task') {
      const index = state.tasks.findIndex((t) => t.id === id);
      if (index < 0) return null;
      const item = state.tasks[index];
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      return { kind, index, item };
    }
    const index = state.habits.findIndex((h) => h.id === id);
    if (index < 0) return null;
    const item = state.habits[index];
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }));
    return { kind, index, item };
  },

  restoreItem: (removed) =>
    set((s) => {
      const insert = <T,>(list: T[], item: T) => {
        const out = [...list];
        out.splice(Math.min(removed.index, out.length), 0, item);
        return out;
      };
      if (removed.kind === 'event')
        return { events: insert(s.events, removed.item) };
      if (removed.kind === 'task')
        return { tasks: insert(s.tasks, removed.item) };
      return { habits: insert(s.habits, removed.item) };
    }),

  toggleCalendar: (id) =>
    set((s) => ({
      calendars: s.calendars.map((c) =>
        c.id === id ? { ...c, visible: !c.visible } : c,
      ),
    })),

  connectAccount: (provider, email) => {
    const accountId = uid('acc');
    const account: Account = {
      id: accountId,
      email,
      initial: (email[0] ?? '?').toUpperCase(),
      provider,
    };
    const calendar: Calendar = {
      id: uid('cal'),
      name: email.split('@')[0] || 'Calendario',
      dot: '#8a8a93',
      kind: '',
      accountId,
      visible: true,
    };
    set((s) => ({
      accounts: [...s.accounts, account],
      calendars: [...s.calendars, calendar],
    }));
  },

  disconnectAccount: (id) =>
    set((s) => ({
      accounts: s.accounts.filter((a) => a.id !== id),
      calendars: s.calendars.filter((c) => c.accountId !== id),
    })),

  subscribeCalendar: (name, kind) =>
    set((s) => ({
      calendars: [
        ...s.calendars,
        {
          id: uid('cal'),
          name,
          dot: '#5c5c65',
          kind,
          accountId: null,
          visible: true,
          readOnly: true,
        },
      ],
    })),

  refresh: () => {
    if (get().refreshing) return;
    set({ refreshing: true });
    // Mock: no hay red todavía, solo el estado momentáneo del drawer.
    setTimeout(
      () => set({ refreshing: false, lastSync: Date.now() }),
      1400,
    );
  },
}));
