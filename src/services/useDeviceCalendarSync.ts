/**
 * Keeps the events of the device calendars in the store.
 *
 * Mounted once, next to the notification sync, in `src/app/_layout.tsx`. It
 * reads when the app starts, when it comes back to the foreground and when the
 * user pulls the side menu's refresh, which is the only syncing the app has:
 * everything else it holds never leaves the phone.
 *
 * The read is a whole replacement, not a merge of changes: the device is the
 * source of truth for its own events, and asking it again is cheap.
 */
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useAppStore } from '@/store/useAppStore';
import {
  DEVICE_CALENDARS_SUPPORTED,
  readDeviceCalendarData,
} from './deviceCalendars';

/**
 * Mounts the reading of the device calendars. Returns nothing: what it does
 * happens in the store.
 */
export function useDeviceCalendarSync() {
  const reading = useRef(false);

  useEffect(() => {
    if (!DEVICE_CALENDARS_SUPPORTED) return;

    let active = true;

    /**
     * Reads and hands the result over. Two reads never overlap: they would ask
     * the same thing and the slower one would undo the faster.
     *
     * A failure is reported and swallowed: reading the device is not something
     * the app can do anything about, and it must not take the screen down with
     * it. Reporting it is not optional though, because a silent failure here
     * looks exactly like a device with no calendars.
     */
    const read = async () => {
      if (reading.current) return;
      reading.current = true;

      try {
        const data = await readDeviceCalendarData(Date.now());
        if (active) useAppStore.getState().finishRefresh(data);
      } catch (error) {
        console.warn('No se pudieron leer los calendarios del sistema', error);
        if (active) useAppStore.getState().finishRefresh(null);
      } finally {
        reading.current = false;
      }
    };

    read();

    const unsubscribeStore = useAppStore.subscribe((state, previous) => {
      if (state.refreshing && !previous.refreshing) read();
    });

    const appStateSubscription = AppState.addEventListener(
      'change',
      (status) => {
        if (status === 'active') read();
      },
    );

    return () => {
      active = false;
      unsubscribeStore();
      appStateSubscription.remove();
    };
  }, []);
}
