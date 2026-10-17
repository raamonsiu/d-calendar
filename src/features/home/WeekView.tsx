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
import { weekColumnItems } from '@/store/selectors';
import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { alpha, color, tint } from '@/theme/tokens';
import type { CalEvent } from '@/types';
import { Bridge } from '@/ui/Bridge';
import { useShownIndex } from './useShownIndex';

/** Gap between columns, which is also the inner radius of the group. */
const COLUMN_GAP = 6;

/** Outer radius of the column group. */
const OUTER_RADIUS = 17;

const DAYS_PER_WEEK = 7;

/**
 * Room between one week and the next.
 *
 * It is only seen while the view is moving: a week at rest still fills the box
 * edge to edge, because the snap counts the gap in and lands on the week itself.
 * Without it the last day of one week and the first of the next sit together as
 * if they belonged to the same row.
 */
const WEEK_GAP = 18;

/** How many weeks the list keeps mounted around the visible one. */
const WINDOW_SIZE = 3;

/**
 * Height of the top of a column - its initial and its number - and of each
 * event row under it, with the gap between rows and the padding the column
 * leaves at its foot. Together they decide how many rows a column has room
 * for, which is what makes a taller box show more of each day.
 */
const COLUMN_HEAD_HEIGHT = 40;
const ROW_HEIGHT = 15;
const ROW_GAP = 3;
const COLUMN_FOOT = 6;

type WeekViewProps = {
  /** Events of every day, from `eventsByDay`. */
  eventsByDay: Map<string, CalEvent[]>;
  /** Week the view opens on is the one holding this day. Read once. */
  initialDay: Date;
  /** Reports the first day of the week the view has been paged to. */
  onShowWeek: (day: Date) => void;
  /** Opens a day in the day view. */
  onPressDay: (day: Date) => void;
};

/**
 * Rows of events a column has room for at a given height.
 *
 * Postcondition: never negative, and 0 while the view has not been measured.
 *
 * @param height Height of a column in px.
 */
function rowsThatFit(height: number) {
  const available = height - COLUMN_HEAD_HEIGHT - COLUMN_FOOT;
  return Math.max(0, Math.floor((available + ROW_GAP) / (ROW_HEIGHT + ROW_GAP)));
}

/**
 * Week view: seven columns joined with the "gap Nothing" bridge (handoff §4b),
 * today tinted in the accent, each one listing the titles of its day's events
 * from the top down - as many as the height of the box lets in, with a "+N"
 * for the rest.
 *
 * It snaps a week at a time rather than scrolling freely: a week is the unit
 * being read, and stopping between two of them shows neither. The label above
 * names the week that is showing and the days it runs between, which is what
 * tells one week from the next once they all look alike.
 */
export function WeekView({
  eventsByDay,
  initialDay,
  onShowWeek,
  onPressDay,
}: WeekViewProps) {
  const { t } = useTranslation();
  const { weekStart, language } = usePrefs();
  const initials = weekdayInitials(weekStart, language);

  /**
   * A week is exactly the view: its width is what the snap is measured from,
   * and its height is what the columns stretch to and fill with rows, which a
   * horizontal list does not hand over on its own.
   */
  const [size, setSize] = useState({ width: 0, height: 0 });
  const maxRows = rowsThatFit(size.height);

  /**
   * The weeks the view pages through, which are the ones that were read. The
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

  /** Distance from one week to the next: a page plus the room between them. */
  const stride = size.width + WEEK_GAP;

  /**
   * Snapping makes this exact: the view settles on a whole number of strides,
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
                  <WeekColumn
                    key={dayKey(day)}
                    day={day}
                    initial={initials[index]}
                    index={index}
                    events={eventsByDay.get(dayKey(day)) ?? []}
                    maxRows={maxRows}
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

/**
 * One day of the week: its initial and number on top and the titles of its
 * events underneath, one per row, the last row turned into "+N" when they do
 * not all fit.
 *
 * The whole column is a single touch target that opens the day: a column is
 * about 40px wide, too narrow for each title to be a target of its own.
 */
function WeekColumn({
  day,
  initial,
  index,
  events,
  maxRows,
  onPress,
}: {
  day: Date;
  initial: string;
  index: number;
  events: CalEvent[];
  maxRows: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const accent = useAccent();
  const today = isToday(day);
  const { shown, hidden } = weekColumnItems(events, maxRows);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('home.dayCellLabel', {
        initial,
        day: day.getDate(),
        count: events.length,
      })}
      onPress={onPress}
      style={({ pressed }) => [
        styles.column,
        groupRadius(index, DAYS_PER_WEEK, OUTER_RADIUS, COLUMN_GAP, 'horizontal'),
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
          gap={COLUMN_GAP}
          surface={color.cardHover}
          behind={color.box}
        />
      ) : null}

      <View style={styles.head}>
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
      </View>

      <View style={styles.rows}>
        {shown.map((event) => (
          <View key={event.id} style={styles.eventRow}>
            <View style={[styles.dot, { backgroundColor: accent }]} />
            <AppText numberOfLines={1} style={styles.eventTitle}>
              {event.title}
            </AppText>
          </View>
        ))}
        {hidden > 0 ? (
          <AppText style={styles.more}>{`+${hidden}`}</AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: 0, gap: 8 },
  weekLabel: { fontSize: 9, letterSpacing: 1.4, color: color.textDim },
  pages: { flex: 1 },
  row: { flexDirection: 'row', gap: COLUMN_GAP, marginRight: WEEK_GAP },
  column: { flex: 1, minWidth: 0, paddingBottom: COLUMN_FOOT },
  head: {
    height: COLUMN_HEAD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  initial: { fontSize: 8, letterSpacing: 1.2 },
  dayNumber: { fontSize: 15 },
  rows: { gap: ROW_GAP, paddingHorizontal: 3 },
  eventRow: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dot: { width: 3, height: 3, borderRadius: 1.5 },
  eventTitle: { flex: 1, fontSize: 8, color: color.textSoft },
  more: {
    height: ROW_HEIGHT,
    fontSize: 8,
    letterSpacing: 0.6,
    color: color.textDim,
    textAlign: 'center',
  },
});
