import type { Habit } from '@/types';
import { habitPeriodStart, rolledOverHabit } from './habits';

/** Lunes 10 de agosto de 2026, y los dias alrededor. */
const MONDAY = new Date(2026, 7, 10, 9, 0).getTime();
const MONDAY_LATE = new Date(2026, 7, 10, 23, 30).getTime();
const TUESDAY = new Date(2026, 7, 11, 8, 0).getTime();
const THURSDAY = new Date(2026, 7, 13, 8, 0).getTime();
const NEXT_MONDAY = new Date(2026, 7, 17, 8, 0).getTime();

/** Minimo para un habito, con lo que cada test varia encima. */
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

describe('habitPeriodStart', () => {
  test('un habito diario cuenta por dias', () => {
    expect(habitPeriodStart('Diario', MONDAY, 'Lunes')).toBe(
      new Date(2026, 7, 10).getTime(),
    );
    expect(habitPeriodStart('X por día', MONDAY_LATE, 'Lunes')).toBe(
      new Date(2026, 7, 10).getTime(),
    );
  });

  test('dos instantes del mismo dia dan el mismo periodo', () => {
    expect(habitPeriodStart('Diario', MONDAY, 'Lunes')).toBe(
      habitPeriodStart('Diario', MONDAY_LATE, 'Lunes'),
    );
  });

  test('un habito semanal cuenta por semanas', () => {
    const monday = habitPeriodStart('Semanal', MONDAY, 'Lunes');
    const thursday = habitPeriodStart('Semanal', THURSDAY, 'Lunes');
    expect(thursday).toBe(monday);
    expect(habitPeriodStart('Semanal', NEXT_MONDAY, 'Lunes')).not.toBe(monday);
  });

  test('la semana empieza donde diga la preferencia', () => {
    const startingMonday = habitPeriodStart('Semanal', TUESDAY, 'Lunes');
    const startingSunday = habitPeriodStart('Semanal', TUESDAY, 'Domingo');
    expect(startingMonday).not.toBe(startingSunday);
  });
});

describe('rolledOverHabit', () => {
  test('dentro del mismo dia no toca nada y devuelve el mismo objeto', () => {
    const counted = habit({
      progress: 3,
      periodStart: habitPeriodStart('X por día', MONDAY, 'Lunes'),
    });
    expect(rolledOverHabit(counted, 'Lunes', MONDAY_LATE)).toBe(counted);
  });

  test('un habito nunca contado entra en el periodo actual sin perder nada', () => {
    const fresh = habit({ progress: 2 });
    const rolled = rolledOverHabit(fresh, 'Lunes', MONDAY);
    expect(rolled.progress).toBe(2);
    expect(rolled.periodStart).toBe(
      habitPeriodStart('X por día', MONDAY, 'Lunes'),
    );
  });

  test('al dia siguiente el progreso vuelve a cero', () => {
    const yesterday = habit({
      progress: 5,
      streak: 4,
      periodStart: habitPeriodStart('X por día', MONDAY, 'Lunes'),
    });
    const rolled = rolledOverHabit(yesterday, 'Lunes', TUESDAY);
    expect(rolled.progress).toBe(0);
  });

  test('completar ayer conserva la racha', () => {
    const completed = habit({
      progress: 5,
      streak: 4,
      periodStart: habitPeriodStart('X por día', MONDAY, 'Lunes'),
    });
    expect(rolledOverHabit(completed, 'Lunes', TUESDAY).streak).toBe(4);
  });

  test('dejar ayer a medias rompe la racha', () => {
    const halfway = habit({
      progress: 2,
      streak: 4,
      periodStart: habitPeriodStart('X por día', MONDAY, 'Lunes'),
    });
    expect(rolledOverHabit(halfway, 'Lunes', TUESDAY).streak).toBe(0);
  });

  test('saltarse dias rompe la racha aunque el ultimo se completara', () => {
    const completed = habit({
      progress: 5,
      streak: 4,
      periodStart: habitPeriodStart('X por día', MONDAY, 'Lunes'),
    });
    expect(rolledOverHabit(completed, 'Lunes', THURSDAY).streak).toBe(0);
  });

  test('un semanal completado sobrevive a la semana siguiente', () => {
    const weekly = habit({
      frequency: 'X por semana',
      target: 4,
      progress: 4,
      streak: 2,
      periodStart: habitPeriodStart('X por semana', MONDAY, 'Lunes'),
    });
    const rolled = rolledOverHabit(weekly, 'Lunes', NEXT_MONDAY);
    expect(rolled.progress).toBe(0);
    expect(rolled.streak).toBe(2);
  });

  test('un semanal no cambia al pasar de lunes a jueves', () => {
    const weekly = habit({
      frequency: 'Semanal',
      target: 1,
      progress: 1,
      periodStart: habitPeriodStart('Semanal', MONDAY, 'Lunes'),
    });
    expect(rolledOverHabit(weekly, 'Lunes', THURSDAY)).toBe(weekly);
  });
});
