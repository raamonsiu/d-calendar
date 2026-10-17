/**
 * Layout arithmetic repeated across several screens. All of it is pure: it
 * takes measurements already obtained with `onLayout` and returns numbers.
 */

/**
 * Side of a cell inside a fixed width grid with equal gaps.
 *
 * It is used by the habit grid on Home, the one in the date picker and the one
 * in the month view, which only differ in the number of columns.
 *
 * Precondition: `columns` is greater than 0; `available` is 0 while the
 * container has not been measured. Postcondition: returns 0 while there is no
 * width, and never a negative number, so the caller can use it as a "not ready
 * to draw yet" flag.
 *
 * @param available Width available for the whole grid.
 * @param gap Gap between columns.
 * @param columns Number of columns.
 */
export function gridCellSize(available: number, gap: number, columns: number) {
  if (available <= 0) return 0;
  return Math.max(0, (available - gap * (columns - 1)) / columns);
}

/**
 * Index of the item in a list of days that should be scrolled to.
 *
 * Precondition: `days` is sorted ascending with no gaps, and `fallbackIndex` is
 * a valid index of the list. Postcondition: always returns an index inside the
 * list; with `target` null or out of range it returns the fallback index or the
 * nearest end.
 *
 * @param days Days being drawn, in order.
 * @param target Day to scroll to, or null.
 * @param fallbackIndex Index to use when there is no target day.
 * @param msPerItem Time distance between two consecutive items.
 */
export function indexOfDay(
  days: Date[],
  target: Date | null | undefined,
  fallbackIndex: number,
  msPerItem: number,
) {
  if (!target) return fallbackIndex;
  const offset = Math.round(
    (target.getTime() - days[0].getTime()) / msPerItem,
  );
  return Math.min(days.length - 1, Math.max(0, offset));
}

/**
 * Least and most of the room below the Home header the calendar box takes,
 * as a share of it. The least is what the box needs for a few hours of a day
 * or a few rows of a week to read; the most keeps the task and habit list
 * from shrinking to its two headings.
 */
export const CALENDAR_MIN_SHARE = 0.4;
export const CALENDAR_MAX_SHARE = 0.7;

/**
 * Height of the calendar box on Home: whatever the task and habit list leaves
 * free, kept between `CALENDAR_MIN_SHARE` and `CALENDAR_MAX_SHARE` of the room
 * the two share.
 *
 * Precondition: every argument is in px; `available` is 0 while it has not
 * been measured. Postcondition: 0 while there is no room measured, otherwise a
 * height between the two shares of `available`, inclusive.
 *
 * @param available Room the box and the list share, gap included.
 * @param listContent Height the list needs to show all it holds.
 * @param gap Room between the box and the list.
 */
export function calendarBoxHeight(
  available: number,
  listContent: number,
  gap: number,
) {
  if (available <= 0) return 0;
  const least = available * CALENDAR_MIN_SHARE;
  const most = available * CALENDAR_MAX_SHARE;
  return Math.min(most, Math.max(least, available - gap - listContent));
}

/**
 * The height a box settles on, given the one it has and the one it is asked
 * to take: a change smaller than `threshold` is ignored, so ticking a habit
 * that moves the list by a few pixels does not make the box twitch.
 *
 * Postcondition: `target` when `current` is 0 or less (nothing settled yet)
 * or when the two are at least `threshold` apart; `current` otherwise.
 *
 * @param current Height the box has now.
 * @param target Height it is being asked to take.
 * @param threshold Smallest change worth moving for.
 */
export function settledHeight(current: number, target: number, threshold: number) {
  if (current <= 0) return target;
  return Math.abs(target - current) < threshold ? current : target;
}
