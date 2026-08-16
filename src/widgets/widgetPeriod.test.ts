import { rolledOverHabit } from '@/lib/habits';
import { useAppStore } from '@/store/useAppStore';
import type { Habit } from '@/types';

/**
 * What the widget draws is a rolled over copy of the stored habit, so these
 * cover the two halves of the promise: that a finished period comes up empty
 * on the widget, and that counting from the widget lands in the new period
 * instead of on top of the old total.
 */

const DAY = 86400000;

function habit(fields: Partial<Habit> = {}): Habit {
  return {
    id: 'h',
    name: 'Beber agua',
    description: '',
    frequency: 'X por día',
    target: 5,
    weekdays: [],
    reminders: [],
    progress: 0,
    streak: 0,
    periodStart: null,
    ...fields,
  };
}

/** Midnight of the day `offsetDays` away from today. */
const midnight = (offsetDays: number) => {
  const day = new Date(Date.now() + offsetDays * DAY);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
};

describe('lo que el widget dibuja', () => {
  test('un habito completado ayer se dibuja vacio hoy', () => {
    const completedYesterday = habit({
      progress: 5,
      streak: 3,
      periodStart: midnight(-1),
    });

    const drawn = rolledOverHabit(completedYesterday, 'Lunes');

    expect(drawn.progress).toBe(0);
    expect(drawn.streak).toBe(3);
  });

  test('un habito completado hoy se dibuja completo', () => {
    const completedToday = habit({ progress: 5, periodStart: midnight(0) });
    expect(rolledOverHabit(completedToday, 'Lunes').progress).toBe(5);
  });

  test('un semanal completado la semana pasada se dibuja vacio', () => {
    const lastWeek = habit({
      frequency: 'X por semana',
      target: 4,
      progress: 4,
      periodStart: midnight(-8),
    });
    expect(rolledOverHabit(lastWeek, 'Lunes').progress).toBe(0);
  });
});

describe('contar desde el widget cuando el periodo ya paso', () => {
  test('el toque abre el periodo nuevo en 1, no suma sobre el anterior', () => {
    useAppStore.setState({
      habits: [habit({ id: 'a', progress: 5, streak: 3, periodStart: midnight(-1) })],
    });

    useAppStore.getState().bumpHabit('a', 1, 'Lunes');

    const [after] = useAppStore.getState().habits;
    expect(after.progress).toBe(1);
    expect(after.periodStart).toBe(midnight(0));
  });

  test('el toque dentro del mismo periodo sigue acumulando', () => {
    useAppStore.setState({
      habits: [habit({ id: 'a', progress: 2, periodStart: midnight(0) })],
    });

    useAppStore.getState().bumpHabit('a', 1, 'Lunes');

    expect(useAppStore.getState().habits[0].progress).toBe(3);
  });

  test('la racha se pierde si el periodo anterior quedo a medias', () => {
    useAppStore.setState({
      habits: [habit({ id: 'a', progress: 2, streak: 6, periodStart: midnight(-1) })],
    });

    useAppStore.getState().bumpHabit('a', 1, 'Lunes');

    expect(useAppStore.getState().habits[0].streak).toBe(0);
  });
});
