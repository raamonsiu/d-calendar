import { StyleSheet, View } from 'react-native';

import { HOURS_PER_DAY } from '@/lib/date';
import { AppText } from '@/theme/Text';
import { color } from '@/theme/tokens';

/**
 * The hour rail of the day strip on Home: one day laid out left to right, from
 * 00 to 23.
 *
 * The strip draws one of these per day and scrolls through them without a break,
 * so the rail is a tile that has to tesselate: the width of a day is exactly
 * `DAY_WIDTH`, and nothing here may add a border or a margin that would push the
 * next day out of place.
 */

/** Width of one hour in px. */
export const HOUR_WIDTH = 62;

/** Width of one day, which is the width of a tile in the strip. */
export const DAY_WIDTH = HOURS_PER_DAY * HOUR_WIDTH;

/** The hours of the rail, ready to be walked while drawing. */
const HOURS = Array.from({ length: HOURS_PER_DAY }, (_, index) => index);

/**
 * Position of an hour of the day inside its own day tile.
 *
 * Precondition: `hour` is decimal (9.5 = 09:30). Postcondition: returns px from
 * midnight, between 0 and `DAY_WIDTH`.
 *
 * @param hour Hour of the day, in decimal.
 */
export const hourToLeft = (hour: number) => hour * HOUR_WIDTH;

/** Row of hour labels that sits on top of the rail. */
export function HourRuler({
  height,
  background,
}: {
  height: number;
  background?: string;
}) {
  return (
    <View style={[styles.ruler, { height, backgroundColor: background }]}>
      {HOURS.map((hour) => (
        <View key={hour} style={styles.hourCell}>
          <AppText style={styles.hourLabel}>
            {String(hour).padStart(2, '0')}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/**
 * Vertical lines of the hour grid. They are absolutely positioned, so the
 * container has to be relative and have its own height.
 *
 * The line at midnight is the one that separates two days and is drawn stronger:
 * without it a strip that never stops would give no clue where a day ends.
 */
export function HourGridLines() {
  return (
    <>
      {HOURS.map((hour) => (
        <View
          key={hour}
          style={[
            styles.gridLine,
            { left: hourToLeft(hour) },
            hour === 0 && styles.dayLine,
          ]}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  ruler: { flexDirection: 'row' },
  hourCell: {
    width: HOUR_WIDTH,
    borderLeftWidth: 1,
    borderLeftColor: color.line,
    paddingLeft: 6,
  },
  hourLabel: { fontSize: 9, letterSpacing: 1.4, color: color.textDim },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: color.hairline,
  },
  dayLine: { backgroundColor: color.line },
});
