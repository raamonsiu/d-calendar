import { Pressable, StyleSheet, View } from 'react-native';

import { dayKey, isToday, isoWeek, weekdayInitials } from '@/lib/date';
import { groupRadius } from '@/lib/groupRadius';
import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { alpha, color, tint } from '@/theme/tokens';
import { Bridge } from '@/ui/Bridge';
import { EventDots } from './EventDots';

/** Gap between cells, which is also the inner radius of the group. */
const CELL_GAP = 6;

/** Outer radius of the cell group. */
const OUTER_RADIUS = 17;

type WeekStripProps = {
  days: Date[];
  counts: Map<string, number>;
  onPressDay: (day: Date) => void;
};

/**
 * Collapsed week: seven cells joined with the "gap Nothing" bridge (handoff
 * §4b), borderless and with today tinted in the accent.
 *
 * The bridge is drawn on every cell but the first, because each one covers the
 * gap on its left.
 */
export function WeekStrip({ days, counts, onPressDay }: WeekStripProps) {
  const accent = useAccent();
  const { weekStart } = usePrefs();
  const initials = weekdayInitials(weekStart);

  return (
    <View style={styles.wrap}>
      <AppText style={styles.weekLabel}>SEMANA {isoWeek(days[0])}</AppText>

      <View style={styles.row}>
        {days.map((day, index) => {
          const today = isToday(day);
          const eventCount = counts.get(dayKey(day)) ?? 0;

          return (
            <Pressable
              key={day.toISOString()}
              accessibilityRole="button"
              accessibilityLabel={`${initials[index]} ${day.getDate()}, ${eventCount} eventos`}
              onPress={() => onPressDay(day)}
              style={({ pressed }) => [
                styles.cell,
                groupRadius(
                  index,
                  days.length,
                  OUTER_RADIUS,
                  CELL_GAP,
                  'horizontal',
                ),
                {
                  backgroundColor: today
                    ? alpha(accent, pressed ? tint.todayPressed : tint.today)
                    : pressed
                      ? color.cardPressed
                      : color.cardHover,
                },
              ]}>
              {index > 0 ? (
                <Bridge
                  axis="horizontal"
                  gap={CELL_GAP}
                  surface={color.cardHover}
                  behind={color.box}
                />
              ) : null}

              <AppText
                style={[
                  styles.initial,
                  { color: today ? accent : color.textDim },
                ]}>
                {initials[index]}
              </AppText>
              <AppText
                weight={400}
                style={[
                  styles.dayNumber,
                  { color: today ? color.text : color.textStrong },
                ]}>
                {day.getDate()}
              </AppText>

              <View style={styles.dots}>
                <EventDots count={eventCount} dotSize={4} fontSize={8.5} />
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
  weekLabel: { fontSize: 9, letterSpacing: 1.6, color: color.textDim },
  row: { flex: 1, flexDirection: 'row', gap: CELL_GAP },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 9,
    gap: 4,
  },
  initial: { fontSize: 8, letterSpacing: 1.2 },
  dayNumber: { fontSize: 15 },
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
});
