import { Pressable, StyleSheet, View } from 'react-native';

import { dayKey, dowInitials, isToday, isoWeek } from '@/lib/date';
import { groupRadius } from '@/lib/groupRadius';
import { T } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { alpha, color } from '@/theme/tokens';
import { Bridge } from '@/ui/Bridge';

const GAP = 6;

type Props = {
  days: Date[];
  counts: Map<string, number>;
  onPressDay: (day: Date) => void;
};

/**
 * Semana colapsada: 7 celdas conectadas en horizontal con el puente del
 * handoff §4b (gap 6, radios 17/6, sin bordes).
 */
export function WeekStrip({ days, counts, onPressDay }: Props) {
  const accent = useAccent();
  const { weekStart } = usePrefs();
  const initials = dowInitials(weekStart);

  return (
    <View style={styles.wrap}>
      <T style={styles.weekLabel}>SEMANA {isoWeek(days[0])}</T>
      <View style={styles.row}>
        {days.map((day, i) => {
          const today = isToday(day);
          const n = counts.get(dayKey(day)) ?? 0;
          const dots = Math.min(3, n);

          return (
            <Pressable
              key={day.toISOString()}
              accessibilityRole="button"
              accessibilityLabel={`${initials[i]} ${day.getDate()}, ${n} eventos`}
              onPress={() => onPressDay(day)}
              style={({ pressed }) => [
                styles.cell,
                groupRadius(i, days.length, 17, GAP, 'horizontal'),
                {
                  backgroundColor: today
                    ? alpha(accent, pressed ? 0.2 : 0.14)
                    : pressed
                      ? '#1c1c20'
                      : color.cardHover,
                },
              ]}>
              {i > 0 ? (
                <Bridge
                  axis="horizontal"
                  gap={GAP}
                  surface={color.cardHover}
                  behind={color.box}
                />
              ) : null}

              <T
                style={[
                  styles.dow,
                  { color: today ? accent : '#5f5f67' },
                ]}>
                {initials[i]}
              </T>
              <T
                w={400}
                style={[
                  styles.num,
                  { color: today ? color.text : '#c9c9d0' },
                ]}>
                {day.getDate()}
              </T>

              <View style={styles.dots}>
                {Array.from({ length: dots }, (_, k) => (
                  <View
                    key={k}
                    style={[styles.dot, { backgroundColor: accent }]}
                  />
                ))}
                {n > 3 ? <T style={styles.more}>+{n - 3}</T> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: 0, gap: 8 },
  weekLabel: { fontSize: 9, letterSpacing: 1.6, color: '#5f5f67' },
  row: { flex: 1, flexDirection: 'row', gap: GAP },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 9,
    gap: 4,
  },
  dow: { fontSize: 8, letterSpacing: 1.2 },
  num: { fontSize: 15 },
  dots: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dot: { width: 4, height: 4, borderRadius: 2 },
  more: { fontSize: 8.5, color: color.textMuted },
});
