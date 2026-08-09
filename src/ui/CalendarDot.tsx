import { StyleSheet, View } from 'react-native';

import { useAccent } from '@/theme/prefs';

/**
 * Side of the dot everywhere a calendar is named with room to spare: the
 * destination button, the sheet that lists them and the default in Settings.
 */
const DEFAULT_SIZE = 7;

/**
 * The colour dot of a calendar.
 *
 * It carries the one rule every place that draws it shares: a calendar with no
 * colour of its own is drawn with the accent. The side menu asks for a smaller
 * one, which is the only reason the size is a prop.
 */
export function CalendarDot({
  color,
  size = DEFAULT_SIZE,
}: {
  /** The calendar's colour; null falls back to the accent. */
  color: string | null;
  size?: number;
}) {
  const accent = useAccent();

  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color ?? accent,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: { flexShrink: 0 },
});
