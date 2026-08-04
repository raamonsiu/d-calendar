import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { decimalHours } from '@/lib/date';
import { layoutDay } from '@/store/selectors';
import { T } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color } from '@/theme/tokens';
import type { CalEvent } from '@/types';

export const START_H = 6;
export const END_H = 23;
export const HOUR_W = 62;
export const RAIL_W = (END_H - START_H + 1) * HOUR_W;

/** Dos carriles para los solapes. */
const LANE_TOP = [0, 78];
const CARD_H = 70;

type Props = {
  events: CalEvent[];
  onPressEvent: (event: CalEvent) => void;
};

/**
 * Franja horaria de hoy: ScrollView horizontal con ~5 h visibles y autoscroll
 * inicial a la hora actual − 24px (handoff §5, `data-rn="TodayTimeline"`).
 */
export function TodayTimeline({ events, onPressEvent }: Props) {
  const accent = useAccent();
  const ref = useRef<ScrollView>(null);
  const scrolled = useRef(false);
  // El carril necesita alto explícito: dentro de un ScrollView horizontal
  // `flex: 1` estiraría el ancho, no el alto.
  const [height, setHeight] = useState(0);

  const nowX = (decimalHours(new Date()) - START_H) * HOUR_W;
  const laid = layoutDay(events, START_H, HOUR_W);

  useEffect(() => {
    if (scrolled.current) return;
    scrolled.current = true;
    // Sin animación: es la posición de partida, no un movimiento.
    requestAnimationFrame(() =>
      ref.current?.scrollTo({ x: Math.max(0, nowX - 24), animated: false }),
    );
  }, [nowX]);

  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.flex}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      contentContainerStyle={{ width: RAIL_W }}>
      <View style={[styles.rail, { height }]}>
        <View style={styles.hourRow}>
          {Array.from({ length: END_H - START_H + 1 }, (_, i) => (
            <View key={i} style={styles.hourCell}>
              <T style={styles.hourLabel}>
                {String(START_H + i).padStart(2, '0')}
              </T>
            </View>
          ))}
        </View>

        <View style={styles.canvas}>
          {Array.from({ length: END_H - START_H + 1 }, (_, i) => (
            <View key={i} style={[styles.gridLine, { left: i * HOUR_W }]} />
          ))}

          {nowX >= 0 && nowX <= RAIL_W ? (
            <>
              <View
                style={[styles.nowLine, { left: nowX, backgroundColor: accent }]}
              />
              <View
                style={[
                  styles.nowDot,
                  { left: nowX - 2, backgroundColor: accent },
                ]}
              />
            </>
          ) : null}

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
                  backgroundColor: pressed ? '#1c1c20' : color.cardHover,
                },
              ]}>
              <View style={styles.cardHead}>
                <View style={[styles.dot, { backgroundColor: accent }]} />
                <T style={styles.cardTime}>{startLabel}</T>
              </View>
              <T w={400} numberOfLines={3} style={styles.cardTitle}>
                {event.title}
              </T>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rail: { width: RAIL_W },
  hourRow: { flexDirection: 'row', height: 16 },
  hourCell: {
    width: HOUR_W,
    borderLeftWidth: 1,
    borderLeftColor: color.line,
    paddingLeft: 6,
  },
  hourLabel: { fontSize: 9, letterSpacing: 1.4, color: '#5f5f67' },
  canvas: { position: 'absolute', left: 0, top: 22, bottom: 0, width: RAIL_W },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: color.hairline,
  },
  nowLine: { position: 'absolute', top: -8, bottom: 0, width: 1 },
  nowDot: {
    position: 'absolute',
    top: -11,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  card: {
    position: 'absolute',
    height: CARD_H,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 7,
    gap: 3,
    overflow: 'hidden',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  cardTime: { fontSize: 9, letterSpacing: 0.6, color: '#7d7d85' },
  cardTitle: {
    fontSize: 10,
    letterSpacing: -0.2,
    lineHeight: 13,
    color: '#e9e9ec',
  },
});
