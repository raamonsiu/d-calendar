import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { addDays, dowInitial, isToday, startOfDay } from '@/lib/date';
import { eventsForDay, layoutDay } from '@/store/selectors';
import { T } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color } from '@/theme/tokens';
import type { CalEvent } from '@/types';
import { HOUR_W, RAIL_W, START_H, END_H } from './TodayTimeline';

const DAYS_BEFORE = 7;
const DAYS_AFTER = 30;
const ROW_H = 132;
const HEADER_H = 18;
const GUTTER_W = 44;
/** Dos carriles dentro de la fila. */
const LANE_TOP = [8, 68];

type Props = {
  events: CalEvent[];
  /** Día al que saltar al montar; por defecto, hoy. */
  focusDay?: Date | null;
  onPressEvent: (event: CalEvent) => void;
};

/**
 * Día expandido: scroll en los dos ejes. La columna de días queda fija a la
 * izquierda y la fila de horas fija arriba (handoff §5.3).
 */
export function DayExpanded({ events, focusDay, onPressEvent }: Props) {
  const accent = useAccent();
  const [height, setHeight] = useState(0);
  const scrollY = useSharedValue(0);

  const days = useMemo(() => {
    const first = addDays(startOfDay(new Date()), -DAYS_BEFORE);
    return Array.from({ length: DAYS_BEFORE + DAYS_AFTER + 1 }, (_, i) =>
      addDays(first, i),
    );
  }, []);

  const rows = useMemo(
    () =>
      days.map((day) => ({
        day,
        laid: layoutDay(eventsForDay(events, day), START_H, HOUR_W, 96),
      })),
    [days, events],
  );

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const gutterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -scrollY.value }],
  }));

  const bodyH = Math.max(0, height - HEADER_H);

  const focusIndex = focusDay
    ? Math.min(
        days.length - 1,
        Math.max(
          0,
          Math.round(
            (startOfDay(focusDay).getTime() - days[0].getTime()) / 86400000,
          ),
        ),
      )
    : DAYS_BEFORE;

  return (
    <View
      style={styles.root}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      {/* Columna de días: fuera del scroll horizontal, sincronizada en vertical. */}
      <View style={styles.gutter}>
        <View style={{ height: HEADER_H }} />
        <View style={[styles.gutterClip, { height: bodyH }]}>
          <Animated.View style={gutterStyle}>
            {days.map((day) => {
              const today = isToday(day);
              return (
                <View key={day.toISOString()} style={styles.gutterRow}>
                  <T
                    style={[
                      styles.dow,
                      { color: today ? accent : '#5f5f67' },
                    ]}>
                    {dowInitial(day)}
                  </T>
                  <T
                    w={400}
                    style={[
                      styles.gutterNum,
                      { color: today ? color.text : color.textMuted },
                    ]}>
                    {day.getDate()}
                  </T>
                </View>
              );
            })}
          </Animated.View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: Math.max(0, (9 - START_H) * HOUR_W), y: 0 }}
        contentContainerStyle={{ width: RAIL_W }}>
        <View style={{ width: RAIL_W, height }}>
          <View style={styles.hourRow}>
            {Array.from({ length: END_H - START_H + 1 }, (_, i) => (
              <View key={i} style={styles.hourCell}>
                <T style={styles.hourLabel}>
                  {String(START_H + i).padStart(2, '0')}
                </T>
              </View>
            ))}
          </View>

          <Animated.ScrollView
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentOffset={{ x: 0, y: focusIndex * ROW_H }}
            style={{ height: bodyH }}>
            {rows.map(({ day, laid }) => (
              <View key={day.toISOString()} style={styles.row}>
                {Array.from({ length: END_H - START_H + 1 }, (_, i) => (
                  <View key={i} style={[styles.gridLine, { left: i * HOUR_W }]} />
                ))}
                {laid.map(({ event, lane, x, width, startLabel }) => (
                  <Pressable
                    key={event.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${event.title}, ${startLabel}`}
                    onPress={() => onPressEvent(event)}
                    style={({ pressed }) => [
                      styles.card,
                      {
                        top: LANE_TOP[lane],
                        left: x,
                        width,
                        borderColor: pressed ? '#3a3a42' : color.border,
                      },
                    ]}>
                    <View style={styles.cardHead}>
                      <View
                        style={[styles.cardDot, { backgroundColor: accent }]}
                      />
                      <T style={styles.cardTime}>{startLabel}</T>
                    </View>
                    <T numberOfLines={2} style={styles.cardTitle}>
                      {event.title}
                    </T>
                  </Pressable>
                ))}
              </View>
            ))}
          </Animated.ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  gutter: { width: GUTTER_W, backgroundColor: color.box, zIndex: 2 },
  gutterClip: { overflow: 'hidden' },
  gutterRow: {
    height: ROW_H,
    justifyContent: 'center',
    gap: 2,
    paddingRight: 6,
    borderTopWidth: 1,
    borderTopColor: '#17171b',
  },
  dow: { fontSize: 8, letterSpacing: 1.4 },
  gutterNum: { fontSize: 17 },
  hourRow: {
    flexDirection: 'row',
    height: HEADER_H,
    backgroundColor: color.box,
  },
  hourCell: {
    width: HOUR_W,
    borderLeftWidth: 1,
    borderLeftColor: color.line,
    paddingLeft: 6,
  },
  hourLabel: { fontSize: 9, letterSpacing: 1.4, color: '#5f5f67' },
  row: {
    height: ROW_H,
    borderTopWidth: 1,
    borderTopColor: '#17171b',
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: color.hairline,
  },
  card: {
    position: 'absolute',
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: color.cardHover,
    paddingVertical: 6,
    paddingHorizontal: 7,
    gap: 2,
    overflow: 'hidden',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardDot: { width: 4, height: 4, borderRadius: 2 },
  cardTime: { fontSize: 8.5, letterSpacing: 0.6, color: '#7d7d85' },
  cardTitle: {
    fontSize: 10,
    letterSpacing: -0.2,
    lineHeight: 12.5,
    color: '#e9e9ec',
  },
});
