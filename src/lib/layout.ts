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
