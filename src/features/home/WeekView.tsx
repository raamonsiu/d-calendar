import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { windowReach } from '@/lib/calendarWindow';
import {
  MS_PER_DAY,
  addDays,
  dayKey,
  formatShortDate,
  isToday,
  isoWeek,
  weekDays,
  weekdayInitials,
} from '@/lib/date';
import { groupRadius } from '@/lib/groupRadius';
import { indexOfDay } from '@/lib/layout';
import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { alpha, color, tint } from '@/theme/tokens';
import { Bridge } from '@/ui/Bridge';
import { EventDots } from './EventDots';
import { useShownIndex } from './useShownIndex';

/** Gap between cells, which is also the inner radius of the group. */
const CELL_GAP = 6;

/** Outer radius of the cell group. */
const OUTER_RADIUS = 17;

const DAYS_PER_WEEK = 7;

/**
 * Weeks the view shows at once. Two, because a single row of seven cells is
 * far shorter than the box, and two of them fill it the way a week would.
 */
const WEEKS_ON_SCREEN = 2;

/** Room between one week and the one under it. */
const WEEK_GAP = 8;

/** How many weeks the list keeps mounted around the visible ones. */
const WINDOW_SIZE = 5;

type WeekViewProps = {
  /** Events per day, from `eventCountsByDay`. */
  counts: Map<string, number>;
  /** The top week is the one holding this day. Read once. */
  initialDay: Date;
  /** Reports the first day of the week at the top of the view. */
  onShowWeek: (day: Date) => void;
  /** Opens a day in the day view. */
  onPressDay: (day: Date) => void;
};

/**
 * Week view: weeks stacked top to bottom, two on screen at a time, each one
 * seven cells joined with the "gap Nothing" bridge (handoff §4b), borderless,
 * with today tinted in the accent and the dots for each day's events.
 *
 * It snaps a week at a time rather than scrolling freely: a week is the unit
 * being read, and stopping between two of them shows neither cleanly. The
 * label above names the two weeks on screen and the days they run between,
 * which is what tells one pair from the next once they all look alike.
 */
export function WeekView({
  counts,
  initialDay,
  onShowWeek,
  onPressDay,
}: WeekViewProps) {
  const { t } = useTranslation();
  const { weekStart, language } = usePrefs();
  const initials = weekdayInitials(weekStart, language);

  /**
   * The view is measured to share its height between the weeks on screen,
   * which is what the snap is measured from too.
   */
  const [height, setHeight] = useState(0);
  const weekHeight = Math.max(
    0,
    (height - WEEK_GAP * (WEEKS_ON_SCREEN - 1)) / WEEKS_ON_SCREEN,
  );

  /**
   * The weeks the view scrolls through, which are the ones that were read. The
   * count is rounded up, so the weeks at either end are complete even when the
   * window cuts them in half: a week drawn with three of its days missing would
   * be stranger than one whose last days are outside what was asked for.
   */
  const weeks = useMemo(() => {
    const today = new Date();
    const { before, after } = windowReach(today, today.getTime());
    const weeksBefore = Math.ceil(before / DAYS_PER_WEEK);
    const weeksAfter = Math.ceil(after / DAYS_PER_WEEK);
    const first = addDays(
      weekDays(today, weekStart)[0],
      -weeksBefore * DAYS_PER_WEEK,
    );

    return Array.from({ length: weeksBefore + weeksAfter + 1 }, (_, offset) =>
      weekDays(addDays(first, offset * DAYS_PER_WEEK), weekStart),
    );
  }, [weekStart]);

  /**
   * Where the view opens, worked out once: like the day view, the day the
   * parent passes is a starting position and not a command.
   */
  const [openingIndex] = useState(() =>
    indexOfDay(
      weeks.map((week) => week[0]),
      weekDays(initialDay, weekStart)[0],
      0,
      DAYS_PER_WEEK * MS_PER_DAY,
    ),
  );

  const [shownIndex, setShownIndex] = useState(openingIndex);

  const reportIndex = useShownIndex(openingIndex, (index) => {
    setShownIndex(index);
    onShowWeek(weeks[index][0]);
  });

  /** Distance from one week to the next: a week plus the room under it. */
  const stride = weekHeight + WEEK_GAP;

  /**
   * Snapping makes this exact: the view settles on a whole number of strides,
   * so the index of the week at the top is a division and not a guess.
   */
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (stride <= WEEK_GAP) return;

    reportIndex(
      Math.min(
        weeks.length - 1,
        Math.max(0, Math.round(event.nativeEvent.contentOffset.y / stride)),
      ),
    );
  };

  const topWeek = weeks[shownIndex];
  const bottomWeek = weeks[Math.min(weeks.length - 1, shownIndex + 1)];

  return (
    <View style={styles.wrap}>
      <AppText numberOfLines={1} style={styles.weekLabel}>
        {t('home.weekPairLabel', {
          first: isoWeek(topWeek[0]),
          second: isoWeek(bottomWeek[0]),
          start: formatShortDate(topWeek[0], language),
          end: formatShortDate(bottomWeek[DAYS_PER_WEEK - 1], language),
        })}
      </AppText>

      <View
        style={styles.pages}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
        {weekHeight > 0 ? (
          <FlatList
            data={weeks}
            keyExtractor={(week) => dayKey(week[0])}
            showsVerticalScrollIndicator={false}
            initialScrollIndex={openingIndex}
            /**
             * `snapToInterval` and not `pagingEnabled`: paging snaps to the
             * height of the list, which here holds two weeks and the room
             * between them, not one.
             */
            snapToInterval={stride}
            snapToAlignment="start"
            decelerationRate="fast"
            getItemLayout={(_, index) => ({
              length: stride,
              offset: index * stride,
              index,
            })}
            windowSize={WINDOW_SIZE}
            onScroll={onScroll}
            scrollEventThrottle={32}
            renderItem={({ item: week }) => (
              <View style={[styles.row, { height: weekHeight }]}>
                {week.map((day, index) => (
                  <WeekCell
                    key={dayKey(day)}
                    day={day}
                    initial={initials[index]}
                    index={index}
                    eventCount={counts.get(dayKey(day)) ?? 0}
                    onPress={() => onPressDay(day)}
                  />
                ))}
              </View>
            )}
          />
        ) : null}
      </View>
    </View>
  );
}

/** One day of a week: its initial, its number and the dots for its events. */
function WeekCell({
  day,
  initial,
  index,
  eventCount,
  onPress,
}: {
  day: Date;
  initial: string;
  index: number;
  eventCount: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const accent = useAccent();
  const today = isToday(day);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('home.dayCellLabel', {
        initial,
        day: day.getDate(),
        count: eventCount,
      })}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        groupRadius(index, DAYS_PER_WEEK, OUTER_RADIUS, CELL_GAP, 'horizontal'),
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
        style={[styles.initial, { color: today ? accent : color.textDim }]}>
        {initial}
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
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: 0, gap: 8 },
  weekLabel: { fontSize: 9, letterSpacing: 1.4, color: color.textDim },
  pages: { flex: 1 },
  row: { flexDirection: 'row', gap: CELL_GAP, marginBottom: WEEK_GAP },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 9,
    gap: 4,
  },
  initial: { fontSize: 8, letterSpacing: 1.2 },
  dayNumber: { fontSize: 15 },
  /**
   * A fixed height, so the dots sit on the same line whether a "+N" follows
   * them or not.
   */
  dots: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 7,
    height: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
