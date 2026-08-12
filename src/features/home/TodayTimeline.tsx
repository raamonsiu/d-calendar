import { useMemo, useState } from 'react';
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
  decimalHours,
  isToday,
  startOfDay,
} from '@/lib/date';
import { indexOfDay } from '@/lib/layout';
import { layoutDay, splitAllDay } from '@/store/selectors';
import { AppText } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color, radius } from '@/theme/tokens';
import type { CalEvent } from '@/types';
import { AllDayChip, CHIP_GAP } from './AllDayChip';
import {
  DAY_WIDTH,
  HOUR_WIDTH,
  HourGridLines,
  HourRuler,
  hourToLeft,
} from './hourRail';
import { useShownIndex } from './useShownIndex';

/**
 * Chips the all-day band draws before collapsing the rest into a count. Three
 * is a day with a holiday, a birthday and a trip; past that the band would be
 * eating the hours it sits on top of.
 */
const MAX_ALL_DAY_ROWS = 3;

/** Room between the all-day band and the hour ruler under it. */
const BAND_GAP = 6;

/** Height of the hour row and of an event card. */
const RULER_HEIGHT = 16;
const CARD_HEIGHT = 70;

/** The two lanes overlapping events are spread across. */
const LANE_TOP = [0, 78];

/** The opening position leaves a little room before the hour it lands on. */
const OPEN_MARGIN = 24;

/** Hour a day other than today opens at: the start of the working day. */
const OPEN_HOUR = 8;

/** How many day tiles the list keeps mounted around the visible one. */
const WINDOW_SIZE = 5;

type TodayTimelineProps = {
  /** Events of every day, from `eventsByDay`. */
  eventsByDay: Map<string, CalEvent[]>;
  /** Day the strip opens on. Read once, when it mounts. */
  initialDay: Date;
  /** Reports the day the strip has been scrolled to. */
  onShowDay: (day: Date) => void;
  onPressEvent: (event: CalEvent) => void;
};

/**
 * The day strip of the collapsed box on Home: hours left to right, about five of
 * them visible at a time.
 *
 * It does not stop at midnight. The days are tiles of the same width laid one
 * after another, so scrolling right runs into tomorrow and the day after, and
 * the day it has reached is reported upwards for the header to say which one it
 * is. That is also how a day tapped in the week or the month view is opened:
 * the strip mounts already scrolled to it.
 *
 * The "now" line is only drawn on today's tile.
 */
export function TodayTimeline({
  eventsByDay,
  initialDay,
  onShowDay,
  onPressEvent,
}: TodayTimelineProps) {
  const accent = useAccent();

  /**
   * The rail needs an explicit height: inside a horizontal list `flex: 1`
   * stretches the width, not the height.
   */
  const [size, setSize] = useState({ width: 0, height: 0 });

  /**
   * The days the strip holds, which are the ones that were read: how far it
   * scrolls is the window and not a number of its own, so it never carries the
   * user past the last day anybody asked the calendars about.
   */
  const { days, daysBefore } = useMemo(() => {
    const today = startOfDay(new Date());
    const { before, after } = windowReach(today, today.getTime());
    const first = addDays(today, -before);

    return {
      daysBefore: before,
      days: Array.from({ length: before + after + 1 }, (_, offset) =>
        addDays(first, offset),
      ),
    };
  }, []);

  /**
   * Where the strip opens, worked out once: `initialDay` is a starting position
   * and not a command, so a later scroll never fights the day the parent last
   * heard about.
   */
  const [opening] = useState(() => {
    const index = indexOfDay(days, initialDay, daysBefore, MS_PER_DAY);
    const hour = isToday(days[index]) ? decimalHours(new Date()) : OPEN_HOUR;
    return {
      index,
      offset: index * DAY_WIDTH + Math.max(0, hourToLeft(hour) - OPEN_MARGIN),
    };
  });

  /**
   * The day the band above the strip is naming. It is kept here as well as
   * reported upwards because that band is not inside the list: it stays put
   * while the hours scroll under it, which is the whole point of it.
   */
  const [shownIndex, setShownIndex] = useState(opening.index);

  const reportIndex = useShownIndex(opening.index, (index) => {
    setShownIndex(index);
    onShowDay(days[index]);
  });

  const shownAllDay = splitAllDay(
    eventsByDay.get(dayKey(days[shownIndex])) ?? [],
  ).allDay;

  /**
   * The day being shown is read a third of the way into the strip rather than at
   * its left edge: stopped near midnight what is on screen is mostly the next
   * day, and that is the one the header should be naming. A third and not the
   * middle because the strip opens an hour or so before the current time, and
   * from the middle that would already count as tomorrow all evening.
   */
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (size.width === 0) return;

    const anchor = event.nativeEvent.contentOffset.x + size.width / 3;
    reportIndex(
      Math.min(days.length - 1, Math.max(0, Math.floor(anchor / DAY_WIDTH))),
    );
  };

  return (
    <View style={styles.root}>
      {shownAllDay.length > 0 ? (
        <View style={styles.band}>
          {shownAllDay.slice(0, MAX_ALL_DAY_ROWS).map((event, index) => {
            const last = index === MAX_ALL_DAY_ROWS - 1;
            const hidden = shownAllDay.length - MAX_ALL_DAY_ROWS;

            return (
              <AllDayChip
                key={event.id}
                event={event}
                extra={last && hidden > 0 ? hidden + 1 : undefined}
                onPress={onPressEvent}
              />
            );
          })}
        </View>
      ) : null}

      <View
        style={styles.strip}
        onLayout={(event) =>
          setSize({
            width: event.nativeEvent.layout.width,
            height: event.nativeEvent.layout.height,
          })
        }>
        {size.height > 0 ? (
          <FlatList
          horizontal
          data={days}
          keyExtractor={dayKey}
          showsHorizontalScrollIndicator={false}
          /**
           * The two go together, and the list expects them to: the index is
           * what decides which tiles are mounted to begin with, and the offset
           * is what places the strip at an hour inside that day. Given a
           * `contentOffset` the list leaves the position alone instead of
           * jumping to the start of the tile.
           */
          initialScrollIndex={opening.index}
          contentOffset={{ x: opening.offset, y: 0 }}
          getItemLayout={(_, index) => ({
            length: DAY_WIDTH,
            offset: index * DAY_WIDTH,
            index,
          })}
          windowSize={WINDOW_SIZE}
          onScroll={onScroll}
          scrollEventThrottle={32}
          renderItem={({ item: day }) => {
            const { timed } = splitAllDay(eventsByDay.get(dayKey(day)) ?? []);
            const laidOut = layoutDay(timed, HOUR_WIDTH);
            const nowLeft = isToday(day)
              ? hourToLeft(decimalHours(new Date()))
              : null;

            return (
              <View style={[styles.tile, { height: size.height }]}>
                <HourRuler height={RULER_HEIGHT} />

                <View style={styles.canvas}>
                  <HourGridLines />

                  {nowLeft !== null ? (
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
                        <View
                          style={[styles.cardDot, { backgroundColor: accent }]}
                        />
                        <AppText style={styles.cardTime}>{startLabel}</AppText>
                      </View>
                      <AppText
                        weight={400}
                        numberOfLines={3}
                        style={styles.cardTitle}>
                        {event.title}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          }}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  /**
   * The band sits outside the list on purpose: an event with no hour has no
   * place on the rail, and one drawn inside a tile would scroll away with the
   * hours. This one stays, and names the day the strip is showing.
   */
  band: { gap: CHIP_GAP, marginBottom: BAND_GAP },
  strip: { flex: 1 },
  tile: { width: DAY_WIDTH },
  canvas: {
    position: 'absolute',
    left: 0,
    top: 22,
    bottom: 0,
    width: DAY_WIDTH,
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
