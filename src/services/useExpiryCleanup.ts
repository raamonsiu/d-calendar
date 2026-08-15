/**
 * Housekeeping of the two things that expire with the calendar: tasks
 * completed on an earlier day, and habits whose period is over.
 *
 * Mounted once, next to the other background jobs in `src/app/_layout.tsx`.
 * Nothing schedules this at midnight itself - the app may well not be running
 * then - so it runs again every time the app comes back to the foreground,
 * which is the next moment either of them can actually be told to go.
 *
 * Neither screen depends on it having run: Home drops expired tasks in
 * `tasksForHome` and rolls habits over in `rolledOverHabits` while drawing.
 * What this adds is making that decision stick in the store, so the reminder
 * plan and the stored data agree with what is on screen.
 */
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAppStore } from '@/store/useAppStore';
import { usePrefs } from '@/theme/prefs';

export function useExpiryCleanup() {
  const { weekStart } = usePrefs();

  useEffect(() => {
    const clean = () => {
      useAppStore.getState().purgeExpiredTasks();
      useAppStore.getState().rollHabitPeriods(weekStart);
    };

    clean();

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') clean();
    });

    return () => subscription.remove();
  }, [weekStart]);
}
