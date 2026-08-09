/**
 * Bridge to the system notification centre.
 *
 * The only module that imports `expo-notifications`: everything else works with
 * the plain plan from `src/lib/notifications.ts`. Nothing here decides what is
 * notified, only how the plan reaches the operating system.
 *
 * There is no server involved and there never will be for reminders: the OS
 * keeps the queue and fires it with the app closed. On web there is no local
 * scheduling at all, so every function returns without doing anything.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  isPlannedId,
  type PlannedNotification,
  type PlannedTrigger,
} from '@/lib/notifications';

/** Local notifications only exist on the native targets. */
export const NOTIFICATIONS_SUPPORTED = Platform.OS !== 'web';

/**
 * Android channel every reminder is posted to. Android 8 and up refuse to show
 * a notification that has no channel, and from Android 13 the permission prompt
 * does not even appear until the app has created one.
 */
const CHANNEL_ID = 'reminders';

/**
 * Key the item id travels in, read back when the user taps the notification.
 */
const ITEM_ID_KEY = 'itemId';

/** State of the system permission, as the settings screen needs to show it. */
export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

/**
 * Prepares the notification system: what to do with a notification that arrives
 * while the app is open, and the Android channel reminders go through.
 *
 * Postcondition: after this resolves the channel exists, so it is safe to ask
 * for the permission. Calling it again only rewrites the same channel.
 */
export async function configureNotifications() {
  if (!NOTIFICATIONS_SUPPORTED) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS !== 'android') return;

  /**
   * `sound` is left out on purpose: in a channel it names a file that has to be
   * bundled through the config plugin, and any other value is reported as a
   * missing resource. Without it the channel takes the system notification
   * sound, which is what the app wants.
   */
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Recordatorios',
    importance: Notifications.AndroidImportance.HIGH,
    enableVibrate: true,
  });
}

/**
 * State of the permission, without ever prompting.
 *
 * Postcondition: 'undetermined' means the prompt has not been shown yet, and
 * 'denied' that only the system settings can undo it. On web it is always
 * 'denied', because nothing can be scheduled there.
 */
export async function getNotificationPermission(): Promise<
  NotificationPermission
> {
  if (!NOTIFICATIONS_SUPPORTED) return 'denied';

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  return current.canAskAgain ? 'undetermined' : 'denied';
}

/**
 * Permission to post notifications, prompting only the first time.
 *
 * Postcondition: returns true when the app may post. Once the user has said no,
 * this stops asking and returns false: the system only shows the prompt once.
 */
export async function ensureNotificationPermission() {
  if (!NOTIFICATIONS_SUPPORTED) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Translates a planned trigger into the shape `expo-notifications` expects.
 *
 * Postcondition: weekly triggers come out with the weekday the library uses (1
 * = Sunday) instead of the `getDay()` index of the model.
 *
 * @param trigger Trigger decided by the planner.
 */
function toTriggerInput(
  trigger: PlannedTrigger,
): Notifications.NotificationTriggerInput {
  if (trigger.kind === 'date') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger.at,
      channelId: CHANNEL_ID,
    };
  }

  if (trigger.kind === 'daily') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: trigger.hour,
      minute: trigger.minute,
      channelId: CHANNEL_ID,
    };
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday: trigger.weekday + 1,
    hour: trigger.hour,
    minute: trigger.minute,
    channelId: CHANNEL_ID,
  };
}

/**
 * Cancels every reminder the planner had scheduled, leaving anything else in
 * the queue alone.
 *
 * Postcondition: after this the queue holds no planned notification, so the
 * caller can schedule the new plan without leftovers from items that no longer
 * exist.
 */
export async function cancelPlannedNotifications() {
  if (!NOTIFICATIONS_SUPPORTED) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const request of scheduled) {
    if (!isPlannedId(request.identifier)) continue;
    await Notifications.cancelScheduledNotificationAsync(request.identifier);
  }
}

/**
 * Makes the system queue hold exactly what the plan says.
 *
 * The old reminders are cancelled and the plan is scheduled again from scratch,
 * instead of comparing them one by one: the plan is small, and rebuilding it
 * whole is the only way to be sure nothing survives from an item that changed
 * or was deleted.
 *
 * Precondition: `configureNotifications` has already run and the permission is
 * granted. Postcondition: returns how many notifications were scheduled.
 *
 * @param plan Notifications the system should be holding.
 */
export async function syncNotifications(plan: PlannedNotification[]) {
  if (!NOTIFICATIONS_SUPPORTED) return 0;

  await cancelPlannedNotifications();

  for (const notification of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: notification.id,
      content: {
        title: notification.title,
        body: notification.body,
        data: { [ITEM_ID_KEY]: notification.itemId },
      },
      trigger: toTriggerInput(notification.trigger),
    });
  }

  return plan.length;
}

/**
 * Subscribes to notification taps.
 *
 * The listener lives here and not in the hook so this stays the only module
 * knowing the library, and the payload is unwrapped before it goes out.
 *
 * Postcondition: returns the function that unsubscribes; on web it returns one
 * that does nothing.
 *
 * @param onTap Called with the id of the item the notification belongs to.
 */
export function addNotificationTapListener(onTap: (itemId: string) => void) {
  if (!NOTIFICATIONS_SUPPORTED) return () => {};

  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const itemId = response.notification.request.content.data?.[ITEM_ID_KEY];
      if (typeof itemId === 'string') onTap(itemId);
    },
  );

  return () => subscription.remove();
}
