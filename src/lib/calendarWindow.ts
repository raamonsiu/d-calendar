import { MS_PER_DAY, addMonths, startOfDay } from '@/lib/date';

/**
 * How far the app reaches, in both senses of the word: how far back and forward
 * it asks the calendars of the device and the servers of the subscribed ones for
 * events, and how far the views let the user scroll.
 *
 * Those two are the same number on purpose, and that is the whole point of this
 * module. They used to differ - three months back and a year forward were read,
 * while the month view scrolled a year back and two forward - and the months
 * outside the read came out empty, which does not look like "not read yet", it
 * looks like "you had nothing on". A calendar that shows an empty November when
 * November is full is worse than one that will not go to November.
 *
 * Two years forward because that is where a booking or a course lands, one back
 * because looking over the past year is normal and further back is archive
 * work. It is bounded because everything read is held in memory, and what comes
 * from a subscription is stored on top of that.
 */
export const WINDOW_MONTHS_BEFORE = 12;
export const WINDOW_MONTHS_AFTER = 24;

/**
 * The window around an instant, snapped to whole months.
 *
 * Whole months because the month view is the one that reaches furthest, and half
 * a month at each end would be a grid with its last row empty for no reason the
 * user can see.
 *
 * Postcondition: `from` is the first instant of its month and `to` the last one
 * of its own, so both ends are days that are drawn complete.
 *
 * @param now Instant the window is centred on.
 */
export function calendarWindow(now: number) {
  /** `addMonths` lands on day 1 at midnight, so zero months is the snap. */
  const firstOfMonth = addMonths(new Date(now), 0);

  return {
    from: addMonths(firstOfMonth, -WINDOW_MONTHS_BEFORE),
    to: new Date(
      addMonths(firstOfMonth, WINDOW_MONTHS_AFTER + 1).getTime() - 1,
    ),
  };
}

/**
 * How many whole days there are between a day and each edge of the window.
 *
 * It is what the views that scroll by day or by week count with: they cannot
 * hold the window as a pair of dates, they need a number of items, and working
 * it out from the window is what keeps them from reaching past what was read.
 *
 * Postcondition: never negative. A day outside the window answers 0 towards the
 * edge it fell off, which leaves the caller with a list of one day rather than
 * with a negative length.
 *
 * @param day Day the counting starts from, usually today.
 * @param now Instant the window is centred on.
 */
export function windowReach(day: Date, now: number) {
  const { from, to } = calendarWindow(now);
  const start = startOfDay(day).getTime();

  return {
    before: Math.max(0, Math.floor((start - from.getTime()) / MS_PER_DAY)),
    after: Math.max(0, Math.floor((to.getTime() - start) / MS_PER_DAY)),
  };
}
