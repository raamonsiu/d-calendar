/**
 * Keeps the system notification queue in step with the store.
 *
 * Mounted once, inside the providers of `src/app/_layout.tsx`. No screen ever
 * schedules anything: the queue is a projection of the data, rebuilt when the
 * data changes, when the app comes back to the foreground (which is what moves
 * the rolling window forward) and when the preference is switched.
 *
 * This is also where a tapped notification turns into navigation.
 */
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { planNotifications, planSignature } from '@/lib/notifications';
import { visibleEvents } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { usePrefs } from '@/theme/prefs';
import {
  NOTIFICATIONS_SUPPORTED,
  addNotificationTapListener,
  cancelPlannedNotifications,
  configureNotifications,
  ensureNotificationPermission,
  syncNotifications,
} from './notifications';

/**
 * Wait before rebuilding after a change, so a burst of edits (or an action that
 * writes twice, like the sync mock) rebuilds the queue once.
 */
const REBUILD_DEBOUNCE_MS = 400;

/**
 * Mounts the reminder scheduling. Returns nothing: everything it does happens
 * outside React.
 */
export function useNotificationSync() {
  const {
    notifications,
    notifyEvents,
    notifyTasks,
    notifyHabits,
    notifyForeignEvents,
    deviceReminders,
  } = usePrefs();
  const rebuildTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSignature = useRef<string | null>(null);

  useEffect(() => {
    if (!NOTIFICATIONS_SUPPORTED) return;

    let active = true;

    /**
     * Recomputes the plan and hands it over, unless it is the same one the
     * system is already holding.
     */
    const rebuild = async () => {
      if (!notifications) {
        lastSignature.current = null;
        await cancelPlannedNotifications();
        return;
      }

      const granted = await ensureNotificationPermission();
      if (!active || !granted) return;

      const state = useAppStore.getState();

      /**
       * The alarms an event brought with it from somewhere else only enter the
       * plan when the user asks for them, because the calendar they came from
       * already announces them. A reminder they set themselves is a different
       * matter: they asked for that one on this phone, so it is scheduled
       * whatever that switch says, as long as foreign events remind at all.
       *
       * A subscribed calendar rarely carries alarms at all, and the ones it does
       * belong to whoever published it, so the same rule reads well for both.
       */
      const brought = notifyForeignEvents
        ? [...state.deviceEvents, ...state.subscriptionEvents]
        : [];
      const chosen = deviceReminders
        ? brought
        : brought.filter((event) => state.eventReminders[event.id]);

      const events = [...(notifyEvents ? state.events : []), ...chosen];

      const plan = planNotifications(
        {
          events: visibleEvents(events, state.calendars),
          tasks: notifyTasks ? state.tasks : [],
          habits: notifyHabits ? state.habits : [],
        },
        Date.now(),
      );

      const signature = planSignature(plan);
      if (signature === lastSignature.current) return;

      await syncNotifications(plan);
      if (active) lastSignature.current = signature;
    };

    const scheduleRebuild = () => {
      if (rebuildTimer.current) clearTimeout(rebuildTimer.current);
      rebuildTimer.current = setTimeout(rebuild, REBUILD_DEBOUNCE_MS);
    };

    const start = async () => {
      await configureNotifications();
      if (active) await rebuild();
    };
    start();

    const unsubscribeStore = useAppStore.subscribe(scheduleRebuild);
    const appStateSubscription = AppState.addEventListener(
      'change',
      (status) => {
        if (status === 'active') scheduleRebuild();
      },
    );

    return () => {
      active = false;
      if (rebuildTimer.current) clearTimeout(rebuildTimer.current);
      unsubscribeStore();
      appStateSubscription.remove();
    };
  }, [
    notifications,
    notifyEvents,
    notifyTasks,
    notifyHabits,
    notifyForeignEvents,
    deviceReminders,
  ]);

  useEffect(
    () =>
      addNotificationTapListener((itemId) => router.push(`/item/${itemId}`)),
    [],
  );
}
