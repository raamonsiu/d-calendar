import { useMemo, useState } from 'react';

import { calendarWindow } from '@/lib/calendarWindow';
import { expandEvents } from '@/lib/occurrences';
import type { CalEvent } from '@/types';
import { visibleEvents } from './selectors';
import { useAppStore } from './useAppStore';

/**
 * Every event drawn as one list: the app's own, the ones read from the device
 * and the ones downloaded from a subscription, narrowed to the calendars that
 * are visible and opened out into the days that draw them. They are drawn the
 * same, and only differ in where they came from and in what tapping one does.
 *
 * Opening them out is `expandEvents`, and it is done here rather than in each
 * view so that all of them agree on what falls on a day: a repetition of the
 * app reaches every day it repeats on, and an event running past midnight
 * reaches every day it touches. A piece keeps the id of the event it came
 * from, so opening one opens the event, and carries the hours of its own day,
 * so nothing downstream has to know it was ever cut.
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

  /**
   * How far the expansion goes, read once: it is the same window the calendars
   * were asked for and the same one the views scroll, and fixing it on mount
   * is what keeps it from changing under a list that is already drawn.
   */
  const [shownWindow] = useState(() => calendarWindow(Date.now()));

  return useMemo(
    () =>
      expandEvents(
        visibleEvents(
          [...events, ...deviceEvents, ...subscriptionEvents],
          calendars,
        ),
        shownWindow.from.getTime(),
        shownWindow.to.getTime(),
      ),
    [events, deviceEvents, subscriptionEvents, calendars, shownWindow],
  );
}
