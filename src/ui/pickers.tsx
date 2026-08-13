import { useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  addMonths,
  isSameDay,
  isToday,
  monthName,
  monthRows,
  startOfDay,
} from '@/lib/date';
import { gridCellSize } from '@/lib/layout';
import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { alpha, color, hitSlopFor, radius, tint } from '@/theme/tokens';
import { Sheet } from './Sheet';
import { WeekdayRow } from './WeekdayRow';
import { Cta, IconButton } from './controls';
import { CaretLeftIcon, CaretRightIcon } from './icons';

/**
 * Own date and time pickers.
 *
 * The native Android dialog cannot be themed from JS (`textColor`,
 * `accentColor` and `themeVariant` are iOS only), so they are rebuilt with the
 * app tokens inside a `Sheet`.
 */

/** Step of the minute wheel. */
const MINUTE_STEP = 5;

/**
 * Height of a wheel row and how many are visible (odd: there is a middle one).
 */
const ITEM_HEIGHT = 42;
const VISIBLE_ITEMS = 5;

/** Width of each wheel and of the colon separator. */
const WHEEL_WIDTH = 86;
const COLON_WIDTH = 14;
const WHEEL_GAP = 4;

/** Gap between cells of the day grid. */
const CELL_GAP = 4;
const COLUMNS = 7;

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;

type PickerMode = 'date' | 'time';

type PickerRequest = {
  mode: PickerMode;
  value: Date;
  onPick: (picked: Date) => void;
  /**
   * Changes on every opening. The sheets use it to move back to the current
   * value without needing an effect.
   */
  session: number;
};

/**
 * Date and time picker shared by a whole form.
 *
 * It is mounted once (`element`) and opened from any control with `open`, which
 * takes the current value and returns the chosen one through a callback. The
 * sheet closes itself on picking.
 *
 * Postcondition: `onPick` is called at most once per opening, and never when
 * the user closes without choosing.
 */
export type DateTimePicker = {
  /** Opens the picker; `onPick` receives the chosen date or time. */
  open: (
    mode: PickerMode,
    value: Date,
    onPick: (picked: Date) => void,
  ) => void;
  /** The picker sheets. They have to be drawn once on the screen. */
  element: ReactNode;
};

export function useDateTimePicker(): DateTimePicker {
  const sessionCounter = useRef(0);
  const [request, setRequest] = useState<PickerRequest | null>(null);
  const [open, setOpen] = useState(false);

  const openPicker = (
    mode: PickerMode,
    value: Date,
    onPick: (picked: Date) => void,
  ) => {
    sessionCounter.current += 1;
    setRequest({ mode, value, onPick, session: sessionCounter.current });
    setOpen(true);
  };

  const close = () => setOpen(false);

  const commit = (picked: Date) => {
    request?.onPick(picked);
    setOpen(false);
  };

  const element = (
    <>
      <DateSheet
        open={open && request?.mode === 'date'}
        request={request}
        onClose={close}
        onPick={commit}
      />
      <TimeSheet
        open={open && request?.mode === 'time'}
        request={request}
        onClose={close}
        onPick={commit}
      />
    </>
  );

  return { open: openPicker, element };
}

type PickerSheetProps = {
  open: boolean;
  request: PickerRequest | null;
  onClose: () => void;
  onPick: (picked: Date) => void;
};

/**
 * Day grid of a month, with month navigation and a shortcut to today.
 *
 * The selected day and today are marked with the accent; every other cell only
 * changes surface while pressed. The cells are drawn once the container has
 * been measured, because their side is derived from the width.
 */
function DateSheet({ open, request, onClose, onPick }: PickerSheetProps) {
  const { t } = useTranslation();
  const accent = useAccent();
  const { weekStart, language } = usePrefs();
  const [width, setWidth] = useState(0);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [session, setSession] = useState(0);

  /** On opening, the grid moves to the month of the current value. */
  if (request && request.session !== session) {
    setSession(request.session);
    setVisibleMonth(request.value);
  }

  const selected = request?.value;
  const rows = monthRows(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    weekStart,
  );
  const cellSize = gridCellSize(width, CELL_GAP, COLUMNS);

  return (
    <Sheet open={open} onClose={onClose} title={t('pickers.chooseDate')}>
      <View style={styles.monthBar}>
        <IconButton
          size={30}
          label={t('pickers.previousMonth')}
          onPress={() => setVisibleMonth((month) => addMonths(month, -1))}>
          <CaretLeftIcon size={14} color={color.textMuted} />
        </IconButton>

        <View style={styles.monthName}>
          <AppText weight={500} style={styles.monthLabel}>
            {monthName(visibleMonth.getMonth(), language)}
          </AppText>
          <AppText style={styles.yearLabel}>
            {visibleMonth.getFullYear()}
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          hitSlop={hitSlopFor(28)}
          onPress={() => setVisibleMonth(new Date())}
          style={styles.todayButton}>
          <AppText style={[styles.todayLabel, { color: accent }]}>
            {t('pickers.today')}
          </AppText>
        </Pressable>

        <IconButton
          size={30}
          label={t('pickers.nextMonth')}
          onPress={() => setVisibleMonth((month) => addMonths(month, 1))}>
          <CaretRightIcon size={14} color={color.textMuted} />
        </IconButton>
      </View>

      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <WeekdayRow cellWidth={cellSize} gap={CELL_GAP} />

        {cellSize > 0
          ? rows.map((row, rowIndex) => (
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

                  const isSelected = !!selected && isSameDay(day, selected);
                  const marked = isSelected || isToday(day);

                  return (
                    <Pressable
                      key={columnIndex}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={t('pickers.dayOfMonth', {
                        day: day.getDate(),
                        month: monthName(day.getMonth(), language),
                      })}
                      onPress={() => onPick(startOfDay(day))}
                      style={({ pressed }) => [
                        styles.cell,
                        {
                          width: cellSize,
                          height: cellSize,
                          borderColor: marked ? accent : 'transparent',
                          backgroundColor: isSelected
                            ? alpha(accent, tint.selected)
                            : pressed
                              ? color.cardHover
                              : color.card,
                        },
                      ]}>
                      <AppText
                        weight={isSelected ? 500 : 300}
                        style={{
                          fontSize: 13,
                          color: marked ? accent : color.textSoft,
                        }}>
                        {day.getDate()}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            ))
          : null}
      </View>
    </Sheet>
  );
}

/**
 * Two wheels, hours and minutes, with the selection band in the middle.
 *
 * Unlike the date, the time is not applied while spinning: it has to be
 * confirmed with LISTO, because spinning passes through many intermediate
 * values.
 */
function TimeSheet({ open, request, onClose, onPick }: PickerSheetProps) {
  const { t } = useTranslation();
  const baseDate = request?.value ?? new Date();
  const [hour, setHour] = useState(baseDate.getHours());
  const [minute, setMinute] = useState(snapToStep(baseDate.getMinutes()));
  const [session, setSession] = useState(0);

  /** On opening, the wheels go back to the time of the current value. */
  if (request && request.session !== session) {
    setSession(request.session);
    setHour(request.value.getHours());
    setMinute(snapToStep(request.value.getMinutes()));
  }

  const hours = Array.from({ length: HOURS_PER_DAY }, (_, index) => index);
  const minutes = Array.from(
    { length: MINUTES_PER_HOUR / MINUTE_STEP },
    (_, index) => index * MINUTE_STEP,
  );

  const confirm = () => {
    const picked = new Date(baseDate);
    picked.setHours(hour, minute, 0, 0);
    onPick(picked);
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('pickers.chooseTime')}>
      <View style={styles.wheels}>
        <View style={styles.band} pointerEvents="none" />
        <Wheel
          key={`hour-${session}`}
          label={t('pickers.hourWheel')}
          values={hours}
          selected={hour}
          onChange={setHour}
        />
        <AppText style={styles.colon}>:</AppText>
        <Wheel
          key={`minute-${session}`}
          label={t('pickers.minuteWheel')}
          values={minutes}
          selected={minute}
          onChange={setMinute}
        />
      </View>

      <Cta primary label={t('pickers.confirmTime')} onPress={confirm} />
    </Sheet>
  );
}

/**
 * Rounds minutes to the step of the wheel.
 *
 * Precondition: `minutes` is between 0 and 59. Postcondition: the result is a
 * multiple of `MINUTE_STEP` and still below 60, so 58 does not become 60 but 0.
 *
 * @param minutes Minutes of the original time.
 */
function snapToStep(minutes: number) {
  return (
    (Math.round(minutes / MINUTE_STEP) * MINUTE_STEP) % MINUTES_PER_HOUR
  );
}

/**
 * One wheel of the time picker: a scroll that snaps to its rows and reports the
 * value left in the middle.
 *
 * The selected value is drawn larger and in the accent.
 */
function Wheel({
  label,
  values,
  selected,
  onChange,
}: {
  label: string;
  values: number[];
  selected: number;
  onChange: (value: number) => void;
}) {
  const accent = useAccent();

  /**
   * Fixed starting position: if `contentOffset` changed while scrolling, React
   * Native would reapply it and fight the gesture. The wheel is remounted by
   * `key` when the sheet reopens.
   */
  const [initialOffset] = useState(
    () => Math.max(0, values.indexOf(selected)) * ITEM_HEIGHT,
  );

  return (
    <ScrollView
      accessibilityLabel={label}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      scrollEventThrottle={32}
      contentOffset={{ x: 0, y: initialOffset }}
      style={styles.wheel}
      contentContainerStyle={styles.wheelContent}
      onScroll={(event) => {
        /** It only reports on crossing to another value, not on every frame. */
        const centered = Math.round(
          event.nativeEvent.contentOffset.y / ITEM_HEIGHT,
        );
        const index = Math.min(values.length - 1, Math.max(0, centered));
        if (values[index] !== selected) onChange(values[index]);
      }}>
      {values.map((value) => {
        const isSelected = value === selected;
        return (
          <View key={value} style={styles.wheelItem}>
            <AppText
              weight={isSelected ? 500 : 300}
              style={{
                fontSize: isSelected ? 22 : 18,
                color: isSelected ? accent : color.labelDim,
              }}>
              {String(value).padStart(2, '0')}
            </AppText>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  monthBar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthName: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingLeft: 4,
  },
  monthLabel: { fontSize: 14, letterSpacing: -0.2 },
  yearLabel: { fontSize: 9, letterSpacing: 1.4, color: color.labelDim },
  todayButton: { paddingHorizontal: 8 },
  todayLabel: { fontSize: 9, letterSpacing: 1.4 },
  gridRow: { flexDirection: 'row', gap: CELL_GAP, marginBottom: CELL_GAP },
  cell: {
    borderRadius: radius.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheels: {
    /** Fixed width so the selection band hugs exactly the two wheels. */
    width: WHEEL_WIDTH * 2 + WHEEL_GAP * 2 + COLON_WIDTH,
    alignSelf: 'center',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: WHEEL_GAP,
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (ITEM_HEIGHT * (VISIBLE_ITEMS - 1)) / 2,
    height: ITEM_HEIGHT,
    borderRadius: radius.control,
    backgroundColor: color.cardHover,
  },
  wheel: { width: WHEEL_WIDTH },
  wheelContent: { paddingVertical: (ITEM_HEIGHT * (VISIBLE_ITEMS - 1)) / 2 },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colon: {
    width: COLON_WIDTH,
    textAlign: 'center',
    fontSize: 20,
    color: color.faint,
  },
});
