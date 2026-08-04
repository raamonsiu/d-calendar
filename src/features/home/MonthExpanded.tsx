import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { MONTHS, addMonths, dayKey, isToday, monthRows } from '@/lib/date';
import { gridCellSize } from '@/lib/layout';
import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { alpha, color, radius, tint } from '@/theme/tokens';
import { WeekdayRow } from '@/ui/WeekdayRow';
import { EventDots } from './EventDots';

/** Months that can be scrolled through backwards and forwards. */
const MONTHS_BEFORE = 12;
const MONTHS_AFTER = 24;

const COLUMNS = 7;
const CELL_GAP = 4;

/** Fixed heights that feed the `getItemLayout` calculation. */
const TITLE_HEIGHT = 18;
const TITLE_GAP = 9;
const WEEKDAY_HEIGHT = 12;
const MONTH_GAP = 22;

/** How many months the list keeps mounted around the visible one. */
const WINDOW_SIZE = 5;

type MonthExpandedProps = {
  counts: Map<string, number>;
  onPressDay: (day: Date) => void;
};

/**
 * Expanded month view (handoff §5.4): continuous vertical scroll, no paging
 * between months.
 *
 * The grid is drawn once the container has been measured, because the cell side
 * comes from the available width. Today is marked with the accent and every
 * cell carries the dots for its events.
 */
export function MonthExpanded({ counts, onPressDay }: MonthExpandedProps) {
  const accent = useAccent();
  const { weekStart } = usePrefs();
  const [width, setWidth] = useState(0);

  const months = useMemo(() => {
    const first = addMonths(new Date(), -MONTHS_BEFORE);
    return Array.from(
      { length: MONTHS_BEFORE + MONTHS_AFTER + 1 },
      (_, offset) => {
        const date = addMonths(first, offset);
        return {
          date,
          rows: monthRows(date.getFullYear(), date.getMonth(), weekStart),
        };
      },
    );
  }, [weekStart]);

  const cellSize = gridCellSize(width, CELL_GAP, COLUMNS);

  /**
   * Exact height and offset of each month. They are needed to be able to start
   * on the current month: without `getItemLayout` the list does not know which
   * offset to jump to, because months are not all the same height (some take
   * five rows and others six).
   *
   * Every row, the initials one included, adds its own `marginBottom`.
   */
  const layouts = useMemo(() => {
    let offset = 0;
    return months.map((month) => {
      const gridHeight = month.rows.length * (cellSize + CELL_GAP);
      const length =
        TITLE_HEIGHT +
        TITLE_GAP +
        WEEKDAY_HEIGHT +
        CELL_GAP +
        gridHeight +
        MONTH_GAP;
      const layout = { length, offset };
      offset += length;
      return layout;
    });
  }, [months, cellSize]);

  return (
    <View
      style={styles.root}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {cellSize > 0 ? (
        <FlatList
          data={months}
          keyExtractor={(month) =>
            `${month.date.getFullYear()}-${month.date.getMonth()}`
          }
          showsVerticalScrollIndicator={false}
          initialScrollIndex={MONTHS_BEFORE}
          getItemLayout={(_, index) => ({
            length: layouts[index].length,
            offset: layouts[index].offset,
            index,
          })}
          windowSize={WINDOW_SIZE}
          renderItem={({ item: month }) => (
            <View style={styles.month}>
              <View style={styles.monthHead}>
                <AppText weight={500} style={styles.monthName}>
                  {MONTHS[month.date.getMonth()]}
                </AppText>
                <AppText style={styles.monthYear}>
                  {month.date.getFullYear()}
                </AppText>
              </View>

              <WeekdayRow
                cellWidth={cellSize}
                gap={CELL_GAP}
                height={WEEKDAY_HEIGHT}
              />

              {month.rows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.gridRow}>
                  {row.map((day, columnIndex) => {
                    if (!day) {
                      return (
                        <View
                          key={columnIndex}
                          style={{ width: cellSize, height: cellSize }}
                        />
                      );
                    }

                    const today = isToday(day);
                    const eventCount = counts.get(dayKey(day)) ?? 0;

                    return (
                      <Pressable
                        key={columnIndex}
                        accessibilityRole="button"
                        accessibilityLabel={`${day.getDate()}, ${eventCount} eventos`}
                        onPress={() => onPressDay(day)}
                        style={({ pressed }) => [
                          styles.cell,
                          {
                            width: cellSize,
                            height: cellSize,
                            borderColor: today ? accent : color.borderCell,
                            backgroundColor: today
                              ? alpha(accent, tint.cell)
                              : pressed
                                ? color.cardHover
                                : color.cell,
                          },
                        ]}>
                        <AppText
                          weight={400}
                          style={{
                            fontSize: 11.5,
                            color: today
                              ? accent
                              : eventCount
                                ? color.textSoft
                                : color.textQuiet,
                          }}>
                          {day.getDate()}
                        </AppText>
                        <View style={styles.cellDots}>
                          <EventDots
                            count={eventCount}
                            dotSize={3}
                            fontSize={9}
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  month: { marginBottom: MONTH_GAP },
  monthHead: {
    height: TITLE_HEIGHT,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: TITLE_GAP,
  },
  monthName: { fontSize: 14, letterSpacing: -0.2, color: color.text },
  monthYear: { fontSize: 9, letterSpacing: 1.4, color: color.labelDim },
  gridRow: { flexDirection: 'row', gap: CELL_GAP, marginBottom: CELL_GAP },
  cell: {
    borderRadius: radius.chip,
    borderWidth: 1,
    alignItems: 'center',
    paddingTop: 5,
    overflow: 'hidden',
  },
  cellDots: {
    position: 'absolute',
    left: 5,
    right: 4,
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
