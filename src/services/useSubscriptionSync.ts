/**
 * Keeps the calendars subscribed by URL downloaded.
 *
 * Mounted once, next to the other two syncs, in `src/app/_layout.tsx`. It
 * downloads when the app starts, when it comes back to the foreground and when
 * the user pulls the side menu's refresh, which is the same set of moments the
 * device read answers to: from where the user stands there is one "sync", and
 * where each calendar comes from is not their problem.
 */
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useAppStore } from '@/store/useAppStore';
import { usePrefs } from '@/theme/prefs';
import { downloadSubscription } from './subscriptions';

/**
 * Time that has to pass before coming back to the foreground downloads again.
 *
 * Switching apps is not a request for fresh data, and a published calendar
 * changes by the week, not by the minute. Starting the app and pulling the
 * refresh both ignore this: those two *are* a request.
 */
const MIN_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Mounts the downloading of the subscribed calendars. Returns nothing: what it
 * does happens in the store.
 */
export function useSubscriptionSync() {
  const { language } = usePrefs();
  const running = useRef(false);
  const lastAttempt = useRef(0);

  useEffect(() => {
    let active = true;

    /**
     * Downloads every subscribed calendar, one after another.
     *
     * One at a time and not all at once: this runs while the user is looking at
     * the screen, and parsing a calendar blocks the interface for as long as it
     * takes. A calendar that fails is skipped, keeping whatever it had, and does
     * not stop the ones after it.
     *
     * @param force Whether to download even if the last attempt was recent.
     */
    const sync = async (force: boolean) => {
      if (running.current) return;

      const now = Date.now();
      if (!force && now - lastAttempt.current < MIN_INTERVAL_MS) return;

      const subscribed = useAppStore
        .getState()
        .calendars.filter((calendar) => calendar.url);
      if (subscribed.length === 0) return;

      running.current = true;
      lastAttempt.current = now;
      useAppStore.getState().setSyncingSubscriptions(true);

      try {
        for (const calendar of subscribed) {
          const events = await downloadSubscription(
            calendar,
            Date.now(),
            language,
          );
          if (!active) return;
          if (events) {
            useAppStore.getState().finishSubscription(calendar.id, events);
          }
        }
      } finally {
        running.current = false;
        if (active) useAppStore.getState().setSyncingSubscriptions(false);
      }
    };

    sync(true);

    /**
     * The refresh of the side menu asks for everything, subscriptions
     * included. It is the same signal the device read listens to.
     */
    const unsubscribeStore = useAppStore.subscribe((state, previous) => {
      if (state.refreshing && !previous.refreshing) sync(true);
    });

    const appStateSubscription = AppState.addEventListener(
      'change',
      (status) => {
        if (status === 'active') sync(false);
      },
    );

    return () => {
      active = false;
      unsubscribeStore();
      appStateSubscription.remove();
    };
  }, [language]);
}
