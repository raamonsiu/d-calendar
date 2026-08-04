import { StyleSheet, View } from 'react-native';

import { weekStartIndex, weekdayInitials } from '@/lib/date';
import { usePrefs } from '@/theme/prefs';
import { Chip } from '@/ui/Chip';

const DAYS_PER_WEEK = 7;

/**
 * Row of weekdays for selecting several.
 *
 * The visual order follows the week start preference, but the data does not:
 * the values going in and out are `getDay()` indexes (0 = Sunday).
 */
export function WeekdayChips({
  selected,
  onToggle,
}: {
  selected: number[];
  onToggle: (day: number) => void;
}) {
  const { weekStart } = usePrefs();
  const initials = weekdayInitials(weekStart);
  const firstDay = weekStartIndex(weekStart);

  return (
    <View style={styles.row}>
      {initials.map((initial, position) => {
        const day = (firstDay + position) % DAYS_PER_WEEK;
        return (
          <Chip
            key={day}
            grow
            height={32}
            label={initial}
            selected={selected.includes(day)}
            onPress={() => onToggle(day)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5, paddingTop: 2 },
});
