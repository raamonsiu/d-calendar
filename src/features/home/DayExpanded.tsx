import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { windowReach } from '@/lib/calendarWindow';
import {
  addDays,
  dayKey,
  decimalHours,
  isToday,
  startOfDay,
  weekdayInitial,
} from '@/lib/date';
import { layoutDayColumn, splitAllDay } from '@/store/selectors';
import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { color, radius } from '@/theme/tokens';
import type { CalEvent } from '@/types';
import { AllDayChip, CHIP_GAP, allDayHeight } from './AllDayChip';
import {
  DAY_HEIGHT,
  HOUR_GUTTER_WIDTH,
  HOUR_HEIGHT,
  HourGridRows,
  HourGutter,
  hourToTop,
} from './hourGrid';
import { useShownIndex } from './useShownIndex';

/**
 * Days that can be scrolled through, counted from the one the grid opens on and
 * cut short by the read window when the grid opens near one of its edges.
 *
 * The columns are all mounted at once: a grid that pins its hours on the left
 * and its days on top cannot hand the horizontal axis to a virtualised list
 * without every column growing its own vertical scroll. A month back and two
 * forward is as far as this view is worth reading anyway; beyond that the month
 * view is what answers.
 */
const MAX_DAYS_BEFORE = 30;
const MAX_DAYS_AFTER = 60;

/** Width of a day column and height of the row naming the days. */
const DAY_COLUMN_WIDTH = 104;
const HEADER_HEIGHT = 34;

/**
 * Chips of all-day events a column draws before collapsing the rest into a
 * count. Two, because the heading takes its room from the grid and a column is
 * only ~104px wide: what fits there is a hint, not a list.
 */
const MAX_ALL_DAY_ROWS = 2;

/** Hour the vertical scroll starts at: the beginning of the working day. */
const OPEN_HOUR = 8;

/** The opening position leaves a little room above the hour it lands on. */
const OPEN_MARGIN = 20;

type DayExpandedProps = {
  /** Events of every day, from `eventsByDay`. */
  eventsByDay: Map<string, CalEvent[]>;
  /** Day the grid opens on. Read once, when it mounts. */
  initialDay: Date;
  /** Reports the day the grid has been scrolled to. */
  onShowDay: (day: Date) => void;
  onPressEvent: (event: CalEvent) => void;
};

/**
 * Expanded day view: hours going down, days going across, which is the way a
 * calendar is usually read. A card is as tall as its event lasts, so a morning
 * looks like a morning instead of like a row of equal boxes.
 *
 * The hour column stays pinned on the left and the day names pinned on top. To
 * pull that off, the column lives outside the horizontal scroll and is moved
 * vertically by the same offset as the content, read on the UI thread.
 */
export function DayExpanded({
  eventsByDay,
  initialDay,
  onShowDay,
  onPressEvent,
}: DayExpandedProps) {
  const [height, setHeight] = useState(0);
  const scrollY = useSharedValue(0);

  /**
   * The days are laid out around the one the grid opens on, which is read once:
   * `initialDay` is a starting position and not a command, so a later scroll
   * never fights the day the parent last heard about.
   */
  const [openingDay] = useState(() => startOfDay(initialDay));

  const { days, daysBefore } = useMemo(() => {
    const reach = windowReach(openingDay, Date.now());
    const before = Math.min(MAX_DAYS_BEFORE, reach.before);
    const after = Math.min(MAX_DAYS_AFTER, reach.after);
    const first = addDays(openingDay, -before);

    return {
      daysBefore: before,
      days: Array.from({ length: before + after + 1 }, (_, offset) =>
        addDays(first, offset),
      ),
    };
  }, [openingDay]);

  /** Vertical position it opens at: the current hour today, the day's start otherwise. */
  const openingTop = useMemo(() => {
    const hour = isToday(openingDay) ? decimalHours(new Date()) : OPEN_HOUR;
    return Math.max(0, hourToTop(hour) - OPEN_MARGIN);
  }, [openingDay]);

  const reportIndex = useShownIndex(daysBefore, (index) =>
    onShowDay(days[index]),
  );

  const onScrollVertical = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const gutterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -scrollY.value }],
  }));

  /**
   * The day being shown is the one under the left edge of the grid: with two or
   * three columns on screen, that is the one the header is naming.
   */
  const onScrollHorizontal = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    reportIndex(
      Math.min(
        days.length - 1,
        Math.max(
          0,
          Math.round(event.nativeEvent.contentOffset.x / DAY_COLUMN_WIDTH),
        ),
      ),
    );
  };

  /**
   * The heading is as tall as the busiest day on screen needs, and every column
   * gets that height whether it uses it or not: they sit in one row, so a
   * heading that grew only where there was something would leave the grids
   * underneath starting at different heights.
   */
  const allDayByDay = useMemo(
    () =>
      days.map(
        (day) => splitAllDay(eventsByDay.get(dayKey(day)) ?? []).allDay,
      ),
    [days, eventsByDay],
  );
  const headerHeight =
    HEADER_HEIGHT +
    allDayHeight(
      allDayByDay.reduce((most, allDay) => Math.max(most, allDay.length), 0),
      MAX_ALL_DAY_ROWS,
    );

  const bodyHeight = Math.max(0, height - headerHeight);

  return (
    <View
      style={styles.root}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
      <View style={styles.gutter}>
        <View style={{ height: headerHeight }} />
        <View style={[styles.gutterClip, { height: bodyHeight }]}>
          <Animated.View style={gutterStyle}>
            <HourGutter />
          </Animated.View>
        </View>
      </View>

      {height > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: daysBefore * DAY_COLUMN_WIDTH, y: 0 }}
          onScroll={onScrollHorizontal}
          scrollEventThrottle={32}>
          <View style={{ width: days.length * DAY_COLUMN_WIDTH }}>
            <View style={[styles.header, { height: headerHeight }]}>
              {days.map((day, index) => (
                <DayHeading
                  key={dayKey(day)}
                  day={day}
                  allDay={allDayByDay[index]}
                  onPressEvent={onPressEvent}
                />
              ))}
            </View>

            <Animated.ScrollView
              onScroll={onScrollVertical}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              contentOffset={{ x: 0, y: openingTop }}
              style={{ height: bodyHeight }}>
              <View style={styles.body}>
                <HourGridRows />

                {days.map((day) => (
                  <DayColumn
                    key={dayKey(day)}
                    day={day}
                    events={eventsByDay.get(dayKey(day)) ?? []}
                    onPressEvent={onPressEvent}
                  />
                ))}
              </View>
            </Animated.ScrollView>
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

/**
 * Name and number of a day, in the row pinned above the grid, with whatever the
 * day holds that has no hour underneath.
 *
 * This is where an all-day event belongs in this view: the row does not scroll
 * with the hours, so the chip stays in sight wherever the grid has been dragged
 * to, which is the one thing a block on the grid could not do.
 */
function DayHeading({
  day,
  allDay,
  onPressEvent,
}: {
  day: Date;
  allDay: CalEvent[];
  onPressEvent: (event: CalEvent) => void;
}) {
  const accent = useAccent();
  const { language } = usePrefs();
  const today = isToday(day);
  const hidden = allDay.length - MAX_ALL_DAY_ROWS;

  return (
    <View style={styles.heading}>
      <View style={styles.headingRow}>
        <AppText
          style={[
            styles.headingInitial,
            { color: today ? accent : color.textDim },
          ]}>
          {weekdayInitial(day, language)}
        </AppText>
        <AppText
          weight={400}
          style={[
            styles.headingNumber,
            { color: today ? color.text : color.textMuted },
          ]}>
          {day.getDate()}
        </AppText>
      </View>

      {allDay.slice(0, MAX_ALL_DAY_ROWS).map((event, index) => (
        <AllDayChip
          key={event.id}
          event={event}
          extra={
            index === MAX_ALL_DAY_ROWS - 1 && hidden > 0 ? hidden + 1 : undefined
          }
          onPress={onPressEvent}
        />
      ))}
    </View>
  );
}

/**
 * One day of the grid: its own vertical strip, with the events placed by hour
 * and the "now" line when the day is today.
 */
function DayColumn({
  day,
  events,
  onPressEvent,
}: {
  day: Date;
  events: CalEvent[];
  onPressEvent: (event: CalEvent) => void;
}) {
  const accent = useAccent();
  const { timed } = splitAllDay(events);
  const laidOut = layoutDayColumn(timed, HOUR_HEIGHT, DAY_COLUMN_WIDTH);
  const nowTop = isToday(day) ? hourToTop(decimalHours(new Date())) : null;

  return (
    <View style={styles.column}>
      {nowTop !== null ? (
        <View style={[styles.nowLine, { top: nowTop, backgroundColor: accent }]} />
      ) : null}

      {laidOut.map(({ event, top, height, left, width, startLabel }) => (
        <Pressable
          key={event.id}
          accessibilityRole="button"
          accessibilityLabel={`${event.title}, ${startLabel}`}
          onPress={() => onPressEvent(event)}
          style={({ pressed }) => [
            styles.card,
            {
              top,
              height,
              left,
              width,
              borderColor: pressed ? color.outline : color.border,
              backgroundColor: pressed ? color.cardPressed : color.cardHover,
            },
          ]}>
          <AppText style={styles.cardTime}>{startLabel}</AppText>
          <AppText numberOfLines={3} style={styles.cardTitle}>
            {event.title}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  gutter: { width: HOUR_GUTTER_WIDTH, backgroundColor: color.box, zIndex: 2 },
  gutterClip: { overflow: 'hidden' },
  header: { flexDirection: 'row', backgroundColor: color.box },
  heading: {
    width: DAY_COLUMN_WIDTH,
    gap: CHIP_GAP,
    paddingHorizontal: 3,
    borderLeftWidth: 1,
    borderLeftColor: color.lineSoft,
  },
  headingRow: {
    height: HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  headingInitial: { fontSize: 8, letterSpacing: 1.4 },
  headingNumber: { fontSize: 15 },
  body: { height: DAY_HEIGHT, flexDirection: 'row' },
  column: {
    width: DAY_COLUMN_WIDTH,
    height: DAY_HEIGHT,
    borderLeftWidth: 1,
    borderLeftColor: color.lineSoft,
  },
  nowLine: { position: 'absolute', left: 0, right: 0, height: 1 },
  card: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: radius.chip,
    paddingVertical: 4,
    paddingHorizontal: 6,
    gap: 1,
    overflow: 'hidden',
  },
  cardTime: { fontSize: 8.5, letterSpacing: 0.6, color: color.textSubtle },
  cardTitle: {
    fontSize: 10,
    letterSpacing: -0.2,
    lineHeight: 12.5,
    color: color.textBody,
  },
});
