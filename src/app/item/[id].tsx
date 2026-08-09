/**
 * Item detail (route `/item/[id]`).
 *
 * How you get here: by tapping a calendar event, or the settings icon of a task
 * or a habit. It comes up from the bottom, same as Crear.
 *
 * Where it leads: back on save, on close or on delete. If the item does not
 * exist (or has just been deleted) it redirects to Home, so no empty screen is
 * left in the history.
 *
 * Reuses `ItemForm` in edit mode: the item type is derived from the id by
 * looking it up in the store lists, the app's own and the events read from the
 * device. Only the events of a calendar the system lets the app write to get
 * here; the rest open in the calendar app they came from, which Home decides.
 */
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { ItemForm } from '@/features/create/ItemForm';
import type { Editing } from '@/features/create/useItemForm';
import { useAppStore } from '@/store/useAppStore';

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const events = useAppStore((state) => state.events);
  const deviceEvents = useAppStore((state) => state.deviceEvents);
  const subscriptionEvents = useAppStore((state) => state.subscriptionEvents);
  const tasks = useAppStore((state) => state.tasks);
  const habits = useAppStore((state) => state.habits);

  const editing = useMemo<Editing | null>(() => {
    const event = [...events, ...deviceEvents, ...subscriptionEvents].find(
      (candidate) => candidate.id === id,
    );
    if (event) return { kind: 'event', item: event };

    const task = tasks.find((candidate) => candidate.id === id);
    if (task) return { kind: 'task', item: task };

    const habit = habits.find((candidate) => candidate.id === id);
    if (habit) return { kind: 'habit', item: habit };

    return null;
  }, [id, events, deviceEvents, subscriptionEvents, tasks, habits]);

  if (!editing) return <Redirect href="/" />;

  return <ItemForm editing={editing} />;
}
