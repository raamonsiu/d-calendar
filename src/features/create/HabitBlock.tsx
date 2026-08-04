import { Pressable, StyleSheet, View } from 'react-native';

import { isMultiFrequency, isWeeklyFrequency } from '@/lib/habits';
import { AppText, Label } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color, radius } from '@/theme/tokens';
import { Chip } from '@/ui/Chip';
import type { HabitFrequency } from '@/types';
import { WeekdayChips } from './WeekdayChips';
import { ChipWrap, FormBlock } from './blocks';
import type { ItemFormState } from './useItemForm';

const FREQUENCY_OPTIONS: HabitFrequency[] = [
  'Diario',
  'Semanal',
  'X por día',
  'X por semana',
];

/**
 * Frequency box of a habit.
 *
 * The "X por" frequencies add the repetition counter and a preview of the
 * markers the card will carry. The weekly ones add the weekday row. "Diario"
 * shows neither.
 */
export function HabitBlock({ form }: { form: ItemFormState }) {
  const accent = useAccent();
  const { habit } = form;

  return (
    <FormBlock first title="TEMPORALIDAD">
      <ChipWrap>
        {FREQUENCY_OPTIONS.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={habit.frequency === option}
            onPress={() => habit.setFrequency(option)}
          />
        ))}
      </ChipWrap>

      {isMultiFrequency(habit.frequency) ? (
        <>
          <View style={styles.counterRow}>
            <AppText style={styles.counterLabel}>
              {habit.frequency === 'X por día'
                ? 'Veces al día'
                : 'Veces por semana'}
            </AppText>
            <View style={styles.counter}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quitar una"
                onPress={habit.decrement}
                style={({ pressed }) => [
                  styles.counterButton,
                  pressed && { borderColor: accent },
                ]}>
                <AppText style={styles.counterSign}>−</AppText>
              </Pressable>
              <AppText style={styles.counterValue}>{habit.count}</AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Añadir una"
                onPress={habit.increment}
                style={({ pressed }) => [
                  styles.counterButton,
                  pressed && { borderColor: accent },
                ]}>
                <AppText style={styles.counterSign}>+</AppText>
              </Pressable>
            </View>
          </View>

          <View style={styles.markerRow}>
            {Array.from({ length: habit.count }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.marker,
                  { borderColor: accent, backgroundColor: accent },
                ]}
              />
            ))}
            <AppText style={styles.markerLabel}>
              MARCADORES EN LA TARJETA
            </AppText>
          </View>
        </>
      ) : null}

      {isWeeklyFrequency(habit.frequency) ? (
        <View style={styles.days}>
          <Label>Días</Label>
          <WeekdayChips
            selected={habit.weekdays}
            onToggle={habit.toggleWeekday}
          />
        </View>
      ) : null}
    </FormBlock>
  );
}

const styles = StyleSheet.create({
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterLabel: { flex: 1, fontSize: 11.5, color: color.textNote },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  counterButton: {
    width: 34,
    height: 34,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.borderStrong,
    backgroundColor: color.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterSign: { fontSize: 15, color: color.textStrong },
  counterValue: { width: 26, textAlign: 'center', fontSize: 15 },
  markerRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  marker: { width: 6, height: 6, borderRadius: 3, borderWidth: 1 },
  markerLabel: {
    fontSize: 8.5,
    letterSpacing: 1.1,
    color: color.labelDim,
    paddingLeft: 5,
  },
  days: { gap: 7 },
});
