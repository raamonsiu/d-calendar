import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppStore } from '@/store/useAppStore';
import { PREFERENCES_KEY } from '@/theme/prefs';
import type { Habit } from '@/types';
import {
  bumpHabitFromWidget,
  readDayEnd,
  readHabits,
  readWeekStart,
} from './widgetData';

/**
 * These read the same AsyncStorage entry the app's own preferences are stored
 * under (`readPreferences`, shared by `readWeekStart`, `readDayEnd`,
 * `readHabits` and `bumpHabitFromWidget`), so the point of this file is
 * making sure consolidating that read into one did not break any of the
 * fields the widget derives from it.
 */

function habit(fields: Partial<Habit> = {}): Habit {
  return {
    id: 'h',
    name: 'Beber agua',
    description: '',
    frequency: 'Diario',
    target: 1,
    weekdays: [],
    reminders: [],
    progress: 0,
    streak: 0,
    periodStart: null,
    ...fields,
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  useAppStore.setState({ habits: [] });
});

describe('readWeekStart', () => {
  test('reads the stored value', async () => {
    await AsyncStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ weekStart: 'Domingo' }),
    );
    expect(await readWeekStart()).toBe('Domingo');
  });

  test('falls back to Monday with nothing stored', async () => {
    expect(await readWeekStart()).toBe('Lunes');
  });
});

describe('readDayEnd', () => {
  test('reads the stored value', async () => {
    await AsyncStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ dayEndTime: '04:00' }),
    );
    expect(await readDayEnd()).toEqual({ hour: 4, minute: 0 });
  });

  test('falls back to midnight with nothing stored', async () => {
    expect(await readDayEnd()).toEqual({ hour: 0, minute: 0 });
  });

  test('falls back to midnight with a broken stored value', async () => {
    await AsyncStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ dayEndTime: 'not a time' }),
    );
    expect(await readDayEnd()).toEqual({ hour: 0, minute: 0 });
  });
});

describe('readHabits', () => {
  test('rolls a habit over using both the stored week start and day end', async () => {
    await AsyncStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ weekStart: 'Lunes', dayEndTime: '04:00' }),
    );

    /**
     * 02:00 on a Tuesday, with a 04:00 day-end: still Monday's period, so a
     * habit completed "yesterday" (Monday, before the day-end) must still
     * read as done, not rolled over to an empty Tuesday.
     */
    const earlyTuesday = new Date(2026, 7, 11, 2, 0).getTime();
    const mondayStart = new Date(2026, 7, 10, 4, 0).getTime();
    useAppStore.setState({
      habits: [habit({ progress: 1, periodStart: mondayStart })],
    });

    const originalNow = Date.now;
    Date.now = () => earlyTuesday;
    try {
      const [drawn] = await readHabits();
      expect(drawn.progress).toBe(1);
    } finally {
      Date.now = originalNow;
    }
  });
});

describe('bumpHabitFromWidget', () => {
  test('returns null for a habit that no longer exists', async () => {
    expect(await bumpHabitFromWidget('missing')).toBeNull();
  });

  test('adds a repetition and answers with the habit as it stands afterwards', async () => {
    useAppStore.setState({ habits: [habit({ id: 'a', progress: 0, target: 2 })] });
    const bumped = await bumpHabitFromWidget('a');
    expect(bumped?.progress).toBe(1);
  });
});
