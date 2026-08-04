import { StyleSheet, View } from 'react-native';

import { dowInitials, weekStartIndex } from '@/lib/date';
import { usePrefs } from '@/theme/prefs';
import { Chip } from '@/ui/Chip';

/**
 * Fila L M X J V S D. Los valores son índices `getDay()` (0 = domingo), así que
 * el orden visual depende del día de inicio de semana y el dato no.
 */
export function WeekdayChips({
  selected,
  onToggle,
}: {
  selected: number[];
  onToggle: (day: number) => void;
}) {
  const { weekStart } = usePrefs();
  const initials = dowInitials(weekStart);
  const start = weekStartIndex(weekStart);

  return (
    <View style={styles.row}>
      {initials.map((initial, i) => {
        const day = (start + i) % 7;
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
