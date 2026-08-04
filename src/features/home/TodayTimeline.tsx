import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { decimalHours } from '@/lib/date';
import { layoutDay } from '@/store/selectors';
import { AppText } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color, radius } from '@/theme/tokens';
import type { CalEvent } from '@/types';
import {
  HOUR_WIDTH,
  HourGridLines,
  HourRuler,
  RAIL_WIDTH,
  START_HOUR,
  hourToLeft,
} from './hourRail';

/** Height of the hour row and of an event card. */
const RULER_HEIGHT = 16;
const CARD_HEIGHT = 70;

/** The two lanes overlapping events are spread across. */
const LANE_TOP = [0, 78];

/** The autoscroll leaves a little room before the current hour. */
const NOW_MARGIN = 24;

type TodayTimelineProps = {
  events: CalEvent[];
  onPressEvent: (event: CalEvent) => void;
};

/**
 * Today's hour strip, in the collapsed box on Home.
 *
 * It is a horizontal scroll with about five hours visible that starts
 * positioned at the current hour. The "now" line is only drawn when the current
 * hour falls inside the visible hours of the rail.
 */
export function TodayTimeline({ events, onPressEvent }: TodayTimelineProps) {
  const accent = useAccent();
  const scrollRef = useRef<ScrollView>(null);
  const hasScrolled = useRef(false);

  /**
   * The rail needs an explicit height: inside a horizontal ScrollView `flex: 1`
   * stretches the width, not the height.
   */
  const [height, setHeight] = useState(0);

  const nowLeft = hourToLeft(decimalHours(new Date()));
  const laidOut = layoutDay(events, START_HOUR, HOUR_WIDTH);

  useEffect(() => {
    if (hasScrolled.current) return;
    hasScrolled.current = true;
    /** No animation: this is the starting position, not a movement. */
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({
        x: Math.max(0, nowLeft - NOW_MARGIN),
        animated: false,
      }),
    );
  }, [nowLeft]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      contentContainerStyle={styles.railContent}>
      <View style={[styles.rail, { height }]}>
        <HourRuler height={RULER_HEIGHT} />

        <View style={styles.canvas}>
          <HourGridLines />

          {nowLeft >= 0 && nowLeft <= RAIL_WIDTH ? (
            <>
              <View
                style={[
                  styles.nowLine,
                  { left: nowLeft, backgroundColor: accent },
                ]}
              />
              <View
                style={[
                  styles.nowDot,
                  { left: nowLeft - 2, backgroundColor: accent },
                ]}
              />
            </>
          ) : null}

          {laidOut.map(({ event, lane, left, width, startLabel }) => (
            <Pressable
              key={event.id}
              accessibilityRole="button"
              accessibilityLabel={`${event.title}, ${startLabel}`}
              onPress={() => onPressEvent(event)}
              style={({ pressed }) => [
                styles.card,
                {
                  top: LANE_TOP[lane],
                  left,
                  width,
                  borderColor: pressed ? color.outline : color.border,
                  backgroundColor: pressed
                    ? color.cardPressed
                    : color.cardHover,
                },
              ]}>
              <View style={styles.cardHead}>
                <View style={[styles.cardDot, { backgroundColor: accent }]} />
                <AppText style={styles.cardTime}>{startLabel}</AppText>
              </View>
              <AppText weight={400} numberOfLines={3} style={styles.cardTitle}>
                {event.title}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  railContent: { width: RAIL_WIDTH },
  rail: { width: RAIL_WIDTH },
  canvas: {
    position: 'absolute',
    left: 0,
    top: 22,
    bottom: 0,
    width: RAIL_WIDTH,
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
    height: CARD_HEIGHT,
    borderWidth: 1,
    borderRadius: radius.event,
    paddingVertical: 8,
    paddingHorizontal: 7,
    gap: 3,
    overflow: 'hidden',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardDot: { width: 5, height: 5, borderRadius: 2.5 },
  cardTime: { fontSize: 9, letterSpacing: 0.6, color: color.textSubtle },
  cardTitle: {
    fontSize: 10,
    letterSpacing: -0.2,
    lineHeight: 13,
    color: color.textBody,
  },
});
