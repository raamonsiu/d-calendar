/**
 * TEMPORARY. Manual checks for the notification setup, used by the DEBUG block
 * of the settings screen.
 *
 * Delete this file together with `src/features/settings/DebugNotifications.tsx`
 * and its use in `src/app/settings/index.tsx` once reminders have been verified
 * on a device.
 */
import * as Notifications from 'expo-notifications';

import {
  NOTIFICATIONS_SUPPORTED,
  ensureNotificationPermission,
} from './notifications';

/** Marks the debug notifications so they can be told apart in the queue. */
const DEBUG_ID_PREFIX = 'debug';

/**
 * Posts a notification straight away, to check that the permission, the channel
 * and the foreground handler are in place.
 *
 * Postcondition: returns false when there is no permission, having done
 * nothing.
 */
export async function sendDebugNotificationNow() {
  if (!NOTIFICATIONS_SUPPORTED) return false;
  if (!(await ensureNotificationPermission())) return false;

  await Notifications.scheduleNotificationAsync({
    identifier: `${DEBUG_ID_PREFIX}:now`,
    content: { title: 'Prueba inmediata', body: 'La notificación funciona.' },
    trigger: null,
  });
  return true;
}

/**
 * Schedules a notification a few seconds ahead, which is the window to close
 * the app and check that it arrives anyway.
 *
 * Precondition: `seconds` is 1 or more. Postcondition: returns false when there
 * is no permission, having done nothing.
 *
 * @param seconds Delay before it fires.
 */
export async function scheduleDebugNotificationIn(seconds: number) {
  if (!NOTIFICATIONS_SUPPORTED) return false;
  if (!(await ensureNotificationPermission())) return false;

  await Notifications.scheduleNotificationAsync({
    identifier: `${DEBUG_ID_PREFIX}:delayed`,
    content: {
      title: 'Prueba diferida',
      body: `Programada hace ${seconds} segundos.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
  return true;
}

/**
 * How many notifications the system is holding right now, which is the real
 * check on the plan: it should match the reminders of the store.
 *
 * Postcondition: returns 0 on web, where nothing can be scheduled.
 */
export async function countScheduledNotifications() {
  if (!NOTIFICATIONS_SUPPORTED) return 0;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}
