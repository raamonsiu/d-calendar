/**
 * Bridge to the system notification centre.
 *
 * The only module that imports `expo-notifications`: everything else works with
 * the plain plan from `src/lib/notifications.ts`. Nothing here decides what is
 * notified, only how the plan reaches the operating system.
 *
 * There is no server involved and there never will be for reminders: the OS
 * keeps the queue and fires it with the app closed. On web there is no local
 * scheduling at all, so every function returns without doing anything. Expo Go
 * dropped `expo-notifications` support in SDK 53, and the package throws as
 * soon as it is evaluated there, not only when a function is called: importing
 * it pulls in `DevicePushTokenAutoRegistration.fx`, which registers a push
 * token listener at module scope, and that listener throws immediately on
 * Android. So the native module cannot be statically imported here; it is
 * `require`d lazily, only once `NOTIFICATIONS_SUPPORTED` is known to be true,
 * and every exported function below short-circuits to a no-op while it is not
 * loaded, instead of wrapping each call site in a try/catch.
 */
import { isRunningInExpoGo } from 'expo';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';

import {
  isPlannedId,
  type PlannedNotification,
  type PlannedTrigger,
} from '@/lib/notifications';

/**
 * True only inside the Expo Go app, never in a development build or a
 * standalone binary, as reported by `expo` itself.
 */
const RUNNING_IN_EXPO_GO = isRunningInExpoGo();

/** Local notifications only exist on the native targets, outside Expo Go. */
export const NOTIFICATIONS_SUPPORTED =
  Platform.OS !== 'web' && !RUNNING_IN_EXPO_GO;

/**
 * Handle to `expo-notifications`, loaded only when the environment actually
 * supports it.
 *
 * Postcondition: `null` exactly when `NOTIFICATIONS_SUPPORTED` is false, on
 * web and in Expo Go. Every exported function checks it before anything else
 * and returns its no-op value when it is `null`, which also narrows its type
 * for the native calls that follow.
 */
const notifications: typeof NotificationsModule | null = NOTIFICATIONS_SUPPORTED
  ? (require('expo-notifications') as typeof NotificationsModule)
  : null;

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
 * for the permission. Calling it again only rewrites the same channel. Does
 * nothing on web or in Expo Go.
 */
export async function configureNotifications() {
  if (!notifications) return;

  notifications.setNotificationHandler({
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
  await notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Recordatorios',
    importance: notifications.AndroidImportance.HIGH,
    enableVibrate: true,
  });
}

/**
 * State of the permission, without ever prompting.
 *
 * Postcondition: 'undetermined' means the prompt has not been shown yet, and
 * 'denied' that only the system settings can undo it. On web and in Expo Go it
 * is always 'denied', because nothing can be scheduled there.
 */
export async function getNotificationPermission(): Promise<
  NotificationPermission
> {
  if (!notifications) return 'denied';

  const current = await notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  return current.canAskAgain ? 'undetermined' : 'denied';
}

/**
 * Permission to post notifications, prompting only the first time.
 *
 * Postcondition: returns true when the app may post. Once the user has said no,
 * this stops asking and returns false: the system only shows the prompt once.
 * On web and in Expo Go it always returns false, because nothing can be
 * scheduled there.
 */
export async function ensureNotificationPermission() {
  if (!notifications) return false;

  const current = await notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Translates a planned trigger into the shape `expo-notifications` expects.
 *
 * Precondition: `notifications` is loaded - its only caller,
 * `syncNotifications`, has already checked. Postcondition: weekly triggers
 * come out with the weekday the library uses (1 = Sunday) instead of the
 * `getDay()` index of the model.
 *
 * @param trigger Trigger decided by the planner.
 */
function toTriggerInput(
  trigger: PlannedTrigger,
): NotificationsModule.NotificationTriggerInput {
  const scheduling = notifications!.SchedulableTriggerInputTypes;

  if (trigger.kind === 'date') {
    return {
      type: scheduling.DATE,
      date: trigger.at,
      channelId: CHANNEL_ID,
    };
  }

  if (trigger.kind === 'daily') {
    return {
      type: scheduling.DAILY,
      hour: trigger.hour,
      minute: trigger.minute,
      channelId: CHANNEL_ID,
    };
  }

  return {
    type: scheduling.WEEKLY,
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
 * exist. Does nothing on web or in Expo Go.
 */
export async function cancelPlannedNotifications() {
  if (!notifications) return;

  const scheduled = await notifications.getAllScheduledNotificationsAsync();
  for (const request of scheduled) {
    if (!isPlannedId(request.identifier)) continue;
    await notifications.cancelScheduledNotificationAsync(request.identifier);
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
 * granted. Postcondition: returns how many notifications were scheduled; 0 on
 * web or in Expo Go, where none are.
 *
 * @param plan Notifications the system should be holding.
 */
export async function syncNotifications(plan: PlannedNotification[]) {
  if (!notifications) return 0;

  await cancelPlannedNotifications();

  for (const notification of plan) {
    await notifications.scheduleNotificationAsync({
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
 * Postcondition: returns the function that unsubscribes; on web and in Expo Go
 * it returns one that does nothing.
 *
 * @param onTap Called with the id of the item the notification belongs to.
 */
export function addNotificationTapListener(onTap: (itemId: string) => void) {
  if (!notifications) return () => {};

  const subscription = notifications.addNotificationResponseReceivedListener(
    (response) => {
      const itemId = response.notification.request.content.data?.[ITEM_ID_KEY];
      if (typeof itemId === 'string') onTap(itemId);
    },
  );

  return () => subscription.remove();
}
