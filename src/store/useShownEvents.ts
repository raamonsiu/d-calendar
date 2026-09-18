import { useMemo } from 'react';

import type { CalEvent } from '@/types';
import { visibleEvents } from './selectors';
import { useAppStore } from './useAppStore';

/**
 * Every event drawn as one list: the app's own, the ones read from the device
 * and the ones downloaded from a subscription, narrowed to the calendars that
 * are visible. They are drawn the same, and only differ in where they came
 * from and in what tapping one does.
 *
 * Shared by Home and the welcome overlay, which have to agree on what counts
 * as an event of the day.
 *
 * Postcondition: returns a new list only when one of its four sources
 * changes, so it can be a dependency of other memos.
 */
export function useShownEvents(): CalEvent[] {
  const events = useAppStore((state) => state.events);
  const deviceEvents = useAppStore((state) => state.deviceEvents);
  const subscriptionEvents = useAppStore((state) => state.subscriptionEvents);
  const calendars = useAppStore((state) => state.calendars);

  return useMemo(
    () =>
      visibleEvents(
        [...events, ...deviceEvents, ...subscriptionEvents],
        calendars,
      ),
    [events, deviceEvents, subscriptionEvents, calendars],
  );
}
