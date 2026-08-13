/**
 * Drops tasks completed on an earlier day.
 *
 * Mounted once, next to the other background jobs in `src/app/_layout.tsx`.
 * Nothing schedules this at midnight itself - the app may well not be
 * running then - so it runs again every time the app comes back to the
 * foreground, which is the next moment a task that expired overnight can
 * actually be told to go.
 */
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAppStore } from '@/store/useAppStore';

export function useTaskCleanup() {
  useEffect(() => {
    useAppStore.getState().purgeExpiredTasks();

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') useAppStore.getState().purgeExpiredTasks();
    });

    return () => subscription.remove();
  }, []);
}
