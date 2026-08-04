import { Redirect, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { ItemForm, type Editing } from '@/features/create/ItemForm';
import { useAppStore } from '@/store/useAppStore';

/**
 * La «ficha del elemento» que abre el icono de ajustes de una tarea, un hábito
 * o un evento: el mismo formulario de Crear, en modo edición y con Eliminar.
 */
export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const events = useAppStore((s) => s.events);
  const tasks = useAppStore((s) => s.tasks);
  const habits = useAppStore((s) => s.habits);

  const editing = useMemo<Editing | null>(() => {
    const event = events.find((e) => e.id === id);
    if (event) return { kind: 'event', item: event };
    const task = tasks.find((t) => t.id === id);
    if (task) return { kind: 'task', item: task };
    const habit = habits.find((h) => h.id === id);
    if (habit) return { kind: 'habit', item: habit };
    return null;
  }, [id, events, tasks, habits]);

  // El elemento se ha borrado desde esta misma pantalla.
  if (!editing) return <Redirect href="/" />;

  return <ItemForm editing={editing} />;
}
