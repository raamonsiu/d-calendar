import type { CalEvent } from '@/types';

/**
 * Arithmetic of the all-day band of the day view: how tall it is and which
 * chips it names. Kept apart from the chips that draw it so it can be tested
 * without loading any of their icons.
 */

/** Height of one chip, and the gap between two of them. */
export const CHIP_HEIGHT = 20;
export const CHIP_GAP = 3;

/**
 * How much room `count` chips add above a grid, capped at `maxRows`.
 *
 * The caller needs this before drawing, because what the chips take is taken
 * from the grid underneath and the grid has to be told how much is left. Each
 * row counts its own gap, which is the one separating it from whatever sits
 * above it: the heading for the first, the previous chip for the rest.
 *
 * Postcondition: 0 for a day with nothing, so a day with no all-day events adds
 * no room at all rather than an empty strip.
 *
 * @param count How many all-day events the day holds.
 * @param maxRows Most chips that may be drawn.
 */
export function allDayHeight(count: number, maxRows: number) {
  return Math.min(count, maxRows) * (CHIP_HEIGHT + CHIP_GAP);
}

/**
 * Which all-day events the band names and how many it leaves to the "+N"
 * chip: all of them while they fit in `maxRows`, and otherwise one row fewer,
 * the last row going to the chip that opens the whole list.
 *
 * Precondition: `maxRows` is 1 or more. Postcondition: `shown.length` plus
 * `more` is `events.length`, the band never takes more than `maxRows` rows
 * counting the chip, and `more` is never 1 - a chip saying "+1" would take the
 * row the one event it stands for could have used. The input is not mutated.
 *
 * @param events All-day events of the day.
 * @param maxRows Most rows the band may take.
 */
export function allDayBand(events: CalEvent[], maxRows: number) {
  if (events.length <= maxRows) return { shown: events, more: 0 };
  const shownCount = maxRows - 1;
  return {
    shown: events.slice(0, shownCount),
    more: events.length - shownCount,
  };
}
