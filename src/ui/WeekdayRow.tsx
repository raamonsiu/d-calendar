import { StyleSheet, View } from 'react-native';

import { weekdayInitials } from '@/lib/date';
import { AppText } from '@/theme/Text';
import { usePrefs } from '@/theme/prefs';
import { color } from '@/theme/tokens';

/**
 * Row of initials of a month grid (D L M X J V S), in whatever order the week
 * start preference dictates.
 *
 * Each initial takes the width of a cell so it stays centred over its column.
 * `height` is only needed where the height of the row feeds a layout
 * calculation, as in the continuous month scroll.
 */
export function WeekdayRow({
  cellWidth,
  gap,
  height,
}: {
  cellWidth: number;
  gap: number;
  height?: number;
}) {
  const { weekStart, language } = usePrefs();

  return (
    <View style={[styles.row, { gap, height, marginBottom: gap }]}>
      {weekdayInitials(weekStart, language).map((initial, index) => (
        <AppText
          key={`${index}-${initial}`}
          style={[styles.initial, { width: cellWidth }]}>
          {initial}
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  initial: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: color.faint,
    textAlign: 'center',
  },
});
