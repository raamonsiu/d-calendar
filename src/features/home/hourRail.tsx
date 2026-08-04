import { StyleSheet, View } from 'react-native';

import { AppText } from '@/theme/Text';
import { color } from '@/theme/tokens';

/**
 * The hour rail shared by today's strip (collapsed) and the expanded day view:
 * the same hours, the same width per hour and the same grid lines. The only
 * difference between the two views is what gets drawn on top.
 */

/** First and last visible hours of the day. */
export const START_HOUR = 6;
const END_HOUR = 23;

/** Width of one hour in px. */
export const HOUR_WIDTH = 62;

/** How many hour columns the rail has. */
const HOUR_COUNT = END_HOUR - START_HOUR + 1;

/** Total rail width, which is the content of the horizontal scroll. */
export const RAIL_WIDTH = HOUR_COUNT * HOUR_WIDTH;

/** The hours of the rail, ready to be walked while drawing. */
const HOURS = Array.from(
  { length: HOUR_COUNT },
  (_, index) => START_HOUR + index,
);

/**
 * Converts an hour of the day into its position inside the rail.
 *
 * Precondition: `hour` is decimal (9.5 = 09:30). Postcondition: returns px from
 * the start of the rail; the result is negative for hours before `START_HOUR`,
 * which is how the caller detects there is nothing to draw.
 *
 * @param hour Hour of the day, in decimal.
 */
export const hourToLeft = (hour: number) => (hour - START_HOUR) * HOUR_WIDTH;

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
 */
export function HourGridLines() {
  return (
    <>
      {HOURS.map((hour, index) => (
        <View
          key={hour}
          style={[styles.gridLine, { left: index * HOUR_WIDTH }]}
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
});
