import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { MS_PER_DAY, addDays, isToday, startOfDay, weekdayInitial } from '@/lib/date';
import { indexOfDay } from '@/lib/layout';
import { eventsForDay, layoutDay } from '@/store/selectors';
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
} from './hourRail';

/** Days that can be scrolled through backwards and forwards. */
const DAYS_BEFORE = 7;
const DAYS_AFTER = 30;

/** Height of a day row, of the hour row, and width of the day column. */
export const DAY_ROW_HEIGHT = 132;
const RULER_HEIGHT = 18;
const GUTTER_WIDTH = 44;

/** The two lanes inside a day row. */
const LANE_TOP = [8, 68];

/** Card height and minimum width for the title to fit. */
const CARD_HEIGHT = 52;
const CARD_MIN_WIDTH = 96;

/** Hour the horizontal scroll starts at: the beginning of the working day. */
const INITIAL_HOUR = 9;

type DayExpandedProps = {
  events: CalEvent[];
  /** Day to jump to on mount; without it, today. */
  focusDay?: Date | null;
  onPressEvent: (event: CalEvent) => void;
};

/**
 * Expanded day view (handoff §5.3): several days, one per row, scrolling on
 * both axes.
 *
 * The day column stays pinned on the left and the hour row pinned on top. To
 * pull that off, the column lives outside the horizontal scroll and is moved
 * vertically by the same offset as the content, read on the UI thread.
 */
export function DayExpanded({
  events,
  focusDay,
  onPressEvent,
}: DayExpandedProps) {
  const accent = useAccent();
  const [height, setHeight] = useState(0);
  const scrollY = useSharedValue(0);

  const days = useMemo(() => {
    const first = addDays(startOfDay(new Date()), -DAYS_BEFORE);
    return Array.from({ length: DAYS_BEFORE + DAYS_AFTER + 1 }, (_, offset) =>
      addDays(first, offset),
    );
  }, []);

  const rows = useMemo(
    () =>
      days.map((day) => ({
        day,
        laidOut: layoutDay(
          eventsForDay(events, day),
          START_HOUR,
          HOUR_WIDTH,
          CARD_MIN_WIDTH,
        ),
      })),
    [days, events],
  );

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const gutterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -scrollY.value }],
  }));

  const bodyHeight = Math.max(0, height - RULER_HEIGHT);
  const focusIndex = indexOfDay(days, focusDay, DAYS_BEFORE, MS_PER_DAY);

  return (
    <View
      style={styles.root}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
      <View style={styles.gutter}>
        <View style={{ height: RULER_HEIGHT }} />
        <View style={[styles.gutterClip, { height: bodyHeight }]}>
          <Animated.View style={gutterStyle}>
            {days.map((day) => {
              const today = isToday(day);
              return (
                <View key={day.toISOString()} style={styles.gutterRow}>
                  <AppText
                    style={[
                      styles.gutterInitial,
                      { color: today ? accent : color.textDim },
                    ]}>
                    {weekdayInitial(day)}
                  </AppText>
                  <AppText
                    weight={400}
                    style={[
                      styles.gutterNumber,
                      { color: today ? color.text : color.textMuted },
                    ]}>
                    {day.getDate()}
                  </AppText>
                </View>
              );
            })}
          </Animated.View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentOffset={{
          x: Math.max(0, (INITIAL_HOUR - START_HOUR) * HOUR_WIDTH),
          y: 0,
        }}
        contentContainerStyle={styles.railContent}>
        <View style={{ width: RAIL_WIDTH, height }}>
          <HourRuler height={RULER_HEIGHT} background={color.box} />

          <Animated.ScrollView
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentOffset={{ x: 0, y: focusIndex * DAY_ROW_HEIGHT }}
            style={{ height: bodyHeight }}>
            {rows.map(({ day, laidOut }) => (
              <View key={day.toISOString()} style={styles.row}>
                <HourGridLines />

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
                      },
                    ]}>
                    <View style={styles.cardHead}>
                      <View
                        style={[styles.cardDot, { backgroundColor: accent }]}
                      />
                      <AppText style={styles.cardTime}>{startLabel}</AppText>
                    </View>
                    <AppText numberOfLines={2} style={styles.cardTitle}>
                      {event.title}
                    </AppText>
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
  railContent: { width: RAIL_WIDTH },
  gutter: { width: GUTTER_WIDTH, backgroundColor: color.box, zIndex: 2 },
  gutterClip: { overflow: 'hidden' },
  gutterRow: {
    height: DAY_ROW_HEIGHT,
    justifyContent: 'center',
    gap: 2,
    paddingRight: 6,
    borderTopWidth: 1,
    borderTopColor: color.lineSoft,
  },
  gutterInitial: { fontSize: 8, letterSpacing: 1.4 },
  gutterNumber: { fontSize: 17 },
  row: {
    height: DAY_ROW_HEIGHT,
    borderTopWidth: 1,
    borderTopColor: color.lineSoft,
  },
  card: {
    position: 'absolute',
    height: CARD_HEIGHT,
    borderWidth: 1,
    borderRadius: radius.chip,
    backgroundColor: color.cardHover,
    paddingVertical: 6,
    paddingHorizontal: 7,
    gap: 2,
    overflow: 'hidden',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardDot: { width: 4, height: 4, borderRadius: 2 },
  cardTime: { fontSize: 8.5, letterSpacing: 0.6, color: color.textSubtle },
  cardTitle: {
    fontSize: 10,
    letterSpacing: -0.2,
    lineHeight: 12.5,
    color: color.textBody,
  },
});
