import { StyleSheet, View } from 'react-native';

import { HOURS_PER_DAY } from '@/lib/date';
import { AppText } from '@/theme/Text';
import { color } from '@/theme/tokens';

/**
 * The hour grid of the expanded day view: hours going down, days going across,
 * which is the way a calendar is usually read.
 *
 * It is the same day as `hourRail`, turned on its side, and it is a separate
 * file for the same reason the two views are separate: the measurements have
 * nothing to do with each other. An hour is comfortable at 62px wide and cramped
 * at 62px tall.
 */

/** Height of one hour in px. */
export const HOUR_HEIGHT = 56;

/** Height of a whole day, which is what the vertical scroll travels. */
export const DAY_HEIGHT = HOURS_PER_DAY * HOUR_HEIGHT;

/** Width of the pinned column of hour labels. */
export const HOUR_GUTTER_WIDTH = 34;

/** The hours of the grid, ready to be walked while drawing. */
const HOURS = Array.from({ length: HOURS_PER_DAY }, (_, index) => index);

/**
 * Position of an hour of the day inside the grid.
 *
 * Precondition: `hour` is decimal (9.5 = 09:30). Postcondition: returns px from
 * midnight, between 0 and `DAY_HEIGHT`.
 *
 * @param hour Hour of the day, in decimal.
 */
export const hourToTop = (hour: number) => hour * HOUR_HEIGHT;

/**
 * Column of hour labels. It is drawn outside the horizontal scroll, so it stays
 * put while the days go past.
 *
 * The label sits at the top of its hour and midnight carries none: there is no
 * line above it to name.
 */
export function HourGutter() {
  return (
    <View style={styles.gutter}>
      {HOURS.map((hour) => (
        <View key={hour} style={styles.gutterCell}>
          {hour > 0 ? (
            <AppText style={styles.hourLabel}>
              {String(hour).padStart(2, '0')}
            </AppText>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/**
 * Horizontal lines of the hour grid, one per hour across every day. They are
 * absolutely positioned, so the container has to be relative and as tall as
 * `DAY_HEIGHT`.
 */
export function HourGridRows() {
  return (
    <>
      {HOURS.map((hour) => (
        <View key={hour} style={[styles.gridRow, { top: hourToTop(hour) }]} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  gutter: { width: HOUR_GUTTER_WIDTH, height: DAY_HEIGHT },
  gutterCell: {
    height: HOUR_HEIGHT,
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  hourLabel: {
    fontSize: 9,
    letterSpacing: 1.4,
    color: color.textDim,
    /**
     * Lifts the label so it rides on its own line instead of hanging under it.
     * It goes on the text and not on the cell: a margin on the cell would shift
     * every hour after it and the column would drift away from the grid.
     */
    marginTop: -5,
  },
  gridRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: color.hairline,
  },
});
