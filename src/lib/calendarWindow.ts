import { MS_PER_DAY } from '@/lib/date';

/**
 * How far the app looks, in either direction, when it asks somewhere else for
 * events: the calendars of the device and the ones subscribed by URL.
 *
 * A year ahead so an event created here does not vanish the moment it is saved,
 * and because a subscribed calendar has to hold a whole course. Three months
 * back is enough to look over the recent past without dragging in years of
 * history, and it is what bounds what gets stored.
 *
 * The two sources share it on purpose: they end up in the same lists, and a
 * window that differed between them would show one calendar ending where the
 * other carries on.
 */
export const WINDOW_BEFORE_DAYS = 90;
export const WINDOW_AFTER_DAYS = 365;

/**
 * The window itself, around an instant.
 *
 * Postcondition: `from` is always before `to`.
 *
 * @param now Instant the window is centred on.
 */
export function calendarWindow(now: number) {
  return {
    from: new Date(now - WINDOW_BEFORE_DAYS * MS_PER_DAY),
    to: new Date(now + WINDOW_AFTER_DAYS * MS_PER_DAY),
  };
}
