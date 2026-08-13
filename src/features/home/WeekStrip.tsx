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
 * Room between one week and the next.
 *
 * It is only seen while the strip is moving: a week at rest still fills the box
 * edge to edge, because the snap counts the gap in and lands on the week itself.
 * Without it the last day of one week and the first of the next sit together as
 * if they belonged to the same row.
 */
const WEEK_GAP = 18;

/** How many weeks the list keeps mounted around the visible one. */
const WINDOW_SIZE = 3;

type WeekStripProps = {
  counts: Map<string, number>;
  /** Week the strip opens on is the one holding this day. Read once. */
  initialDay: Date;
  /** Reports the first day of the week the strip has been paged to. */
  onShowWeek: (firstDay: Date) => void;
  onPressDay: (day: Date) => void;
};

/**
 * Collapsed week: seven cells joined with the "gap Nothing" bridge (handoff
 * §4b), borderless and with today tinted in the accent.
 *
 * It snaps a week at a time rather than scrolling freely: a week is the unit
 * being read, and stopping between two of them shows neither. The label above
 * names the week that is showing and the days it runs between, which is what
 * tells one week from the next once they all look alike.
 */
export function WeekStrip({
  counts,
  initialDay,
  onShowWeek,
  onPressDay,
}: WeekStripProps) {
  const { t } = useTranslation();
  const { weekStart, language } = usePrefs();
  const initials = weekdayInitials(weekStart, language);

  /**
   * A week is exactly the strip: its width is what the snap is measured from,
   * and its height is what the cells stretch to, which a horizontal list does
   * not hand over on its own.
   */
  const [size, setSize] = useState({ width: 0, height: 0 });

  /**
   * The weeks the strip pages through, which are the ones that were read. The
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
   * Where the strip opens, worked out once: like the day strip, the day the
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

  /** Distance from one week to the next: a page plus the room between them. */
  const stride = size.width + WEEK_GAP;

  /**
   * Snapping makes this exact: the strip settles on a whole number of strides,
   * so the index is a division and not a guess.
   */
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (size.width === 0) return;

    reportIndex(
      Math.min(
        weeks.length - 1,
        Math.max(0, Math.round(event.nativeEvent.contentOffset.x / stride)),
      ),
    );
  };

  const shownWeek = weeks[shownIndex];

  return (
    <View style={styles.wrap}>
      <AppText numberOfLines={1} style={styles.weekLabel}>
        {t('home.weekLabel', {
          number: isoWeek(shownWeek[0]),
          start: formatShortDate(shownWeek[0], language),
          end: formatShortDate(shownWeek[DAYS_PER_WEEK - 1], language),
        })}
      </AppText>

      <View
        style={styles.pages}
        onLayout={(event) =>
          setSize({
            width: event.nativeEvent.layout.width,
            height: event.nativeEvent.layout.height,
          })
        }>
        {size.width > 0 ? (
          <FlatList
            horizontal
            data={weeks}
            keyExtractor={(week) => dayKey(week[0])}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={openingIndex}
            /**
             * `snapToInterval` and not `pagingEnabled`: paging snaps to the
             * width of the list, which knows nothing about the room left
             * between one week and the next and would settle a little further
             * off on every week gone past.
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
              <View style={[styles.row, size]}>
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

/** One day of the strip: its initial, its number and the dots for its events. */
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
  row: { flexDirection: 'row', gap: CELL_GAP, marginRight: WEEK_GAP },
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
