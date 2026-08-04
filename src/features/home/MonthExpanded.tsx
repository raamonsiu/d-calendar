import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import {
  MONTHS,
  addMonths,
  dayKey,
  dowInitials,
  isToday,
  monthRows,
} from '@/lib/date';
import { T } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { alpha, color } from '@/theme/tokens';

const MONTHS_BEFORE = 12;
const MONTHS_AFTER = 24;
const CELL_GAP = 4;
const TITLE_H = 18;
const TITLE_GAP = 9;
const WEEKDAY_H = 12;
const MONTH_GAP = 22;

type Props = {
  counts: Map<string, number>;
  onPressDay: (day: Date) => void;
};

/** Mes expandido: scroll vertical continuo entre meses (handoff §5.4). */
export function MonthExpanded({ counts, onPressDay }: Props) {
  const accent = useAccent();
  const { weekStart } = usePrefs();
  const [width, setWidth] = useState(0);
  const initials = dowInitials(weekStart);

  const months = useMemo(() => {
    const first = addMonths(new Date(), -MONTHS_BEFORE);
    return Array.from({ length: MONTHS_BEFORE + MONTHS_AFTER + 1 }, (_, i) => {
      const d = addMonths(first, i);
      return {
        date: d,
        rows: monthRows(d.getFullYear(), d.getMonth(), weekStart),
      };
    });
  }, [weekStart]);

  const cellSize = width > 0 ? (width - CELL_GAP * 6) / 7 : 0;

  /** Altura exacta de cada mes, para poder saltar a hoy al montar. */
  const layouts = useMemo(() => {
    let offset = 0;
    return months.map((m) => {
      // Cada fila (incluida la de iniciales) lleva marginBottom = CELL_GAP.
      const grid = m.rows.length * (cellSize + CELL_GAP);
      const length =
        TITLE_H + TITLE_GAP + WEEKDAY_H + CELL_GAP + grid + MONTH_GAP;
      const item = { length, offset };
      offset += length;
      return item;
    });
  }, [months, cellSize]);

  return (
    <View
      style={styles.root}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {cellSize > 0 ? (
        <FlatList
          data={months}
          keyExtractor={(m) => `${m.date.getFullYear()}-${m.date.getMonth()}`}
          showsVerticalScrollIndicator={false}
          initialScrollIndex={MONTHS_BEFORE}
          getItemLayout={(_, index) => ({
            length: layouts[index].length,
            offset: layouts[index].offset,
            index,
          })}
          windowSize={5}
          renderItem={({ item }) => (
            <View style={styles.month}>
              <View style={styles.monthHead}>
                <T w={500} style={styles.monthName}>
                  {MONTHS[item.date.getMonth()]}
                </T>
                <T style={styles.monthYear}>{item.date.getFullYear()}</T>
              </View>

              <View style={styles.weekdayRow}>
                {initials.map((wd, i) => (
                  <T key={i} style={[styles.weekday, { width: cellSize }]}>
                    {wd}
                  </T>
                ))}
              </View>

              {item.rows.map((row, r) => (
                <View key={r} style={styles.gridRow}>
                  {row.map((day, c) => {
                    if (!day)
                      return (
                        <View
                          key={c}
                          style={{ width: cellSize, height: cellSize }}
                        />
                      );

                    const today = isToday(day);
                    const n = counts.get(dayKey(day)) ?? 0;

                    return (
                      <Pressable
                        key={c}
                        accessibilityRole="button"
                        accessibilityLabel={`${day.getDate()}, ${n} eventos`}
                        onPress={() => onPressDay(day)}
                        style={({ pressed }) => [
                          styles.cell,
                          {
                            width: cellSize,
                            height: cellSize,
                            borderColor: today ? accent : '#1b1b20',
                            backgroundColor: today
                              ? alpha(accent, 0.08)
                              : pressed
                                ? color.cardHover
                                : '#131316',
                          },
                        ]}>
                        <T
                          w={400}
                          style={{
                            fontSize: 11.5,
                            color: today
                              ? accent
                              : n
                                ? color.textSoft
                                : '#6b6b73',
                          }}>
                          {day.getDate()}
                        </T>
                        <View style={styles.cellDots}>
                          {Array.from({ length: Math.min(3, n) }, (_, k) => (
                            <View
                              key={k}
                              style={[
                                styles.cellDot,
                                { backgroundColor: accent },
                              ]}
                            />
                          ))}
                          {n > 3 ? (
                            <T style={styles.cellMore}>+{n - 3}</T>
                          ) : null}
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
    height: TITLE_H,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: TITLE_GAP,
  },
  monthName: { fontSize: 14, letterSpacing: -0.2, color: color.text },
  monthYear: { fontSize: 9, letterSpacing: 1.4, color: color.labelDim },
  weekdayRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
    height: WEEKDAY_H,
    marginBottom: CELL_GAP,
  },
  weekday: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: color.faint,
    textAlign: 'center',
  },
  gridRow: { flexDirection: 'row', gap: CELL_GAP, marginBottom: CELL_GAP },
  cell: {
    borderRadius: 12,
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
  cellDot: { width: 3, height: 3, borderRadius: 1.5 },
  cellMore: { fontSize: 9, color: color.textMuted },
});
