import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  MONTHS,
  addMonths,
  dowInitials,
  isSameDay,
  isToday,
  monthRows,
  startOfDay,
} from '@/lib/date';
import { T } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { alpha, color, hitSlopFor, radius } from '@/theme/tokens';
import { Sheet } from './Sheet';
import { Cta, IconButton } from './controls';
import { CaretLeftIcon, CaretRightIcon } from './icons';

/**
 * Selectores de fecha y hora propios. El diálogo nativo de Android no se puede
 * tematizar desde JS (`textColor` / `accentColor` / `themeVariant` son solo de
 * iOS), así que se rehacen con los tokens de la app.
 */

const MINUTE_STEP = 5;
const ITEM_H = 42;
const VISIBLE = 5;
const CELL_GAP = 4;

type Mode = 'date' | 'time';

type Pending = {
  mode: Mode;
  value: Date;
  onPick: (d: Date) => void;
  /** Cambia en cada apertura para remontar las ruedas en su posición. */
  session: number;
};

export function useDateTimePicker() {
  const session = useRef(0);
  const [pending, setPending] = useState<Pending | null>(null);
  const [open, setOpen] = useState(false);

  const openPicker = (mode: Mode, value: Date, onPick: (d: Date) => void) => {
    session.current += 1;
    setPending({ mode, value, onPick, session: session.current });
    setOpen(true);
  };

  const close = () => setOpen(false);

  const commit = (date: Date) => {
    pending?.onPick(date);
    setOpen(false);
  };

  const element = (
    <>
      <DateSheet
        open={open && pending?.mode === 'date'}
        pending={pending}
        onClose={close}
        onPick={commit}
      />
      <TimeSheet
        open={open && pending?.mode === 'time'}
        pending={pending}
        onClose={close}
        onPick={commit}
      />
    </>
  );

  return { open: openPicker, element };
}

// ---------------------------------------------------------------- fecha

function DateSheet({
  open,
  pending,
  onClose,
  onPick,
}: {
  open: boolean;
  pending: Pending | null;
  onClose: () => void;
  onPick: (d: Date) => void;
}) {
  const accent = useAccent();
  const { weekStart } = usePrefs();
  const [width, setWidth] = useState(0);
  const [cursor, setCursor] = useState(() => new Date());
  const [session, setSession] = useState(0);

  // Al abrir, la rejilla se sitúa en el mes del valor actual.
  if (pending && pending.session !== session) {
    setSession(pending.session);
    setCursor(pending.value);
  }

  const selected = pending?.value;
  const rows = monthRows(cursor.getFullYear(), cursor.getMonth(), weekStart);

  const cell = width > 0 ? (width - CELL_GAP * 6) / 7 : 0;

  return (
    <Sheet open={open} onClose={onClose} title="Elegir día">
      <View style={styles.monthBar}>
        <IconButton
          size={30}
          label="Mes anterior"
          onPress={() => setCursor((c) => addMonths(c, -1))}>
          <CaretLeftIcon size={14} color={color.textMuted} />
        </IconButton>
        <View style={styles.monthName}>
          <T w={500} style={styles.monthLabel}>
            {MONTHS[cursor.getMonth()]}
          </T>
          <T style={styles.yearLabel}>{cursor.getFullYear()}</T>
        </View>
        <Pressable
          accessibilityRole="button"
          hitSlop={hitSlopFor(28)}
          onPress={() => setCursor(new Date())}
          style={styles.todayBtn}>
          <T style={[styles.todayLabel, { color: accent }]}>HOY</T>
        </Pressable>
        <IconButton
          size={30}
          label="Mes siguiente"
          onPress={() => setCursor((c) => addMonths(c, 1))}>
          <CaretRightIcon size={14} color={color.textMuted} />
        </IconButton>
      </View>

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <View style={styles.weekdayRow}>
          {dowInitials(weekStart).map((wd, i) => (
            <T key={i} style={[styles.weekday, { width: cell }]}>
              {wd}
            </T>
          ))}
        </View>

        {cell > 0
          ? rows.map((row, r) => (
              <View key={r} style={styles.gridRow}>
                {row.map((day, c) => {
                  if (!day)
                    return <View key={c} style={{ width: cell, height: cell }} />;

                  const on = !!selected && isSameDay(day, selected);
                  const today = isToday(day);

                  return (
                    <Pressable
                      key={c}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${day.getDate()} de ${MONTHS[day.getMonth()]}`}
                      onPress={() => onPick(startOfDay(day))}
                      style={({ pressed }) => [
                        styles.cell,
                        {
                          width: cell,
                          height: cell,
                          borderColor: on || today ? accent : 'transparent',
                          backgroundColor: on
                            ? alpha(accent, 0.16)
                            : pressed
                              ? color.cardHover
                              : color.card,
                        },
                      ]}>
                      <T
                        w={on ? 500 : 300}
                        style={{
                          fontSize: 13,
                          color: on || today ? accent : color.textSoft,
                        }}>
                        {day.getDate()}
                      </T>
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

// ---------------------------------------------------------------- hora

function TimeSheet({
  open,
  pending,
  onClose,
  onPick,
}: {
  open: boolean;
  pending: Pending | null;
  onClose: () => void;
  onPick: (d: Date) => void;
}) {
  const base = pending?.value ?? new Date();
  const [hour, setHour] = useState(base.getHours());
  const [minute, setMinute] = useState(
    Math.round(base.getMinutes() / MINUTE_STEP) * MINUTE_STEP,
  );
  const [session, setSession] = useState(0);

  if (pending && pending.session !== session) {
    setSession(pending.session);
    setHour(pending.value.getHours());
    setMinute(
      (Math.round(pending.value.getMinutes() / MINUTE_STEP) * MINUTE_STEP) % 60,
    );
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 / MINUTE_STEP }, (_, i) => i * MINUTE_STEP);

  return (
    <Sheet open={open} onClose={onClose} title="Elegir hora">
      <View style={styles.wheels}>
        <View style={styles.band} pointerEvents="none" />
        <Wheel
          key={`h-${session}`}
          label="hora"
          values={hours}
          selected={hour}
          onChange={setHour}
        />
        <T style={styles.colon}>:</T>
        <Wheel
          key={`m-${session}`}
          label="minutos"
          values={minutes}
          selected={minute}
          onChange={setMinute}
        />
      </View>

      <Cta
        primary
        label="LISTO"
        onPress={() => {
          const d = new Date(base);
          d.setHours(hour, minute, 0, 0);
          onPick(d);
        }}
      />
    </Sheet>
  );
}

function Wheel({
  label,
  values,
  selected,
  onChange,
}: {
  label: string;
  values: number[];
  selected: number;
  onChange: (v: number) => void;
}) {
  const accent = useAccent();
  // Posición de partida fija: si `contentOffset` cambiara al desplazarse, RN lo
  // reaplicaría y pelearía con el gesto. La rueda se remonta por `key`.
  const [initialOffset] = useState(
    () => Math.max(0, values.indexOf(selected)) * ITEM_H,
  );

  return (
    <ScrollView
      accessibilityLabel={label}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      scrollEventThrottle={32}
      contentOffset={{ x: 0, y: initialOffset }}
      style={styles.wheel}
      contentContainerStyle={{
        paddingVertical: (ITEM_H * (VISIBLE - 1)) / 2,
      }}
      onScroll={(e) => {
        // Solo se avisa al cruzar de valor, no en cada frame.
        const next = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
        const clamped = Math.min(values.length - 1, Math.max(0, next));
        if (values[clamped] !== selected) onChange(values[clamped]);
      }}>
      {values.map((v) => {
        const on = v === selected;
        return (
          <View key={v} style={styles.wheelItem}>
            <T
              w={on ? 500 : 300}
              style={{
                fontSize: on ? 22 : 18,
                color: on ? accent : color.labelDim,
              }}>
              {String(v).padStart(2, '0')}
            </T>
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
  todayBtn: { paddingHorizontal: 8 },
  todayLabel: { fontSize: 9, letterSpacing: 1.4 },
  weekdayRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
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
    borderRadius: radius.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheels: {
    // Ancho fijo para que la banda de selección abrace justo a las dos ruedas.
    width: 86 * 2 + 4 * 2 + 14,
    alignSelf: 'center',
    height: ITEM_H * VISIBLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (ITEM_H * (VISIBLE - 1)) / 2,
    height: ITEM_H,
    borderRadius: radius.control,
    backgroundColor: color.cardHover,
  },
  wheel: { width: 86 },
  wheelItem: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  colon: { width: 14, textAlign: 'center', fontSize: 20, color: color.faint },
});
