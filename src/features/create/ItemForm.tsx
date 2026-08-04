import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MONTHS, fmtLongDate, fmtTime, withTime } from '@/lib/date';
import { uid, useAppStore } from '@/store/useAppStore';
import { Label, T } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { alpha, color, hitSlopFor, radius, space } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Chip } from '@/ui/Chip';
import { Field } from '@/ui/Field';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { Switch } from '@/ui/Switch';
import { Cta, DashedButton, Divider } from '@/ui/controls';
import { ClockIcon, TrashIcon, UserPlusIcon, XIcon } from '@/ui/icons';
import { useDateTimePicker } from '@/ui/pickers';
import {
  isMultiFreq,
  isWeeklyFreq,
  type CalEvent,
  type Guest,
  type Habit,
  type HabitFreq,
  type ItemKind,
  type RelReminder,
  type Task,
  type TimeReminder,
} from '@/types';
import { RemindersBlock } from './RemindersBlock';
import { WeekdayChips } from './WeekdayChips';
import { ControlButton, FieldRow, FormBlock, blockGap } from './blocks';

const REPEATS = ['No', 'Cada día', 'Días de la semana', 'Cada mes'] as const;
const FREQS: HabitFreq[] = ['Diario', 'Semanal', 'X por día', 'X por semana'];
const AVAILABILITY = ['Ocupado', 'Libre'] as const;
const VISIBILITY = ['Predet.', 'Privado', 'Público'] as const;

export type Editing =
  | { kind: 'event'; item: CalEvent }
  | { kind: 'task'; item: Task }
  | { kind: 'habit'; item: Habit };

/** Añade o quita un valor de una lista de selección múltiple. */
const toggled = (list: number[], value: number) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

/** Redondea al siguiente cuarto de hora. */
function nextSlot() {
  const d = new Date();
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return d;
}

export function ItemForm({ editing }: { editing?: Editing }) {
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const prefs = usePrefs();
  const toast = useToast();
  const picker = useDateTimePicker();
  const scrollRef = useRef<ScrollView>(null);

  /**
   * Los avisos se añaden al final de la última caja, que puede quedar fuera de
   * pantalla. Tras añadir uno, el formulario baja para que se vea.
   */
  const revealLast = () => {
    setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: !prefs.motionOff }),
      60,
    );
  };

  const calendars = useAppStore((s) => s.calendars);
  // Las acciones de zustand son estables: se leen fuera del render.
  const store = useAppStore.getState();

  const writable = useMemo(
    () => calendars.filter((c) => !c.readOnly && c.kind !== 'TAREAS'),
    [calendars],
  );

  const [kind, setKind] = useState<ItemKind>(editing?.kind ?? 'event');

  // ---- común -------------------------------------------------------------
  const [title, setTitle] = useState(
    editing
      ? editing.kind === 'habit'
        ? editing.item.name
        : editing.item.title
      : '',
  );
  const [description, setDescription] = useState(
    editing?.item.description ?? '',
  );

  // ---- evento ------------------------------------------------------------
  const ev = editing?.kind === 'event' ? editing.item : undefined;
  const [start, setStart] = useState(
    ev ? new Date(ev.start) : nextSlot(),
  );
  const [end, setEnd] = useState(
    ev
      ? new Date(ev.end)
      : new Date(nextSlot().getTime() + prefs.defaultDuration * 60000),
  );
  const [allDay, setAllDay] = useState(ev?.allDay ?? false);
  const [repeat, setRepeat] = useState<CalEvent['repeat']>(ev?.repeat ?? 'No');
  const [eventDays, setEventDays] = useState<number[]>(ev?.weekdays ?? []);
  const [calendarId, setCalendarId] = useState(
    ev?.calendarId ??
      (editing?.kind === 'task' ? editing.item.calendarId : undefined) ??
      prefs.defaultCalendarId,
  );
  const [availability, setAvailability] = useState(ev?.availability ?? 'Ocupado');
  const [visibility, setVisibility] = useState(ev?.visibility ?? 'Predet.');
  const [guests, setGuests] = useState<Guest[]>(ev?.guests ?? []);
  const [guestSheet, setGuestSheet] = useState(false);
  const [guestName, setGuestName] = useState('');

  // ---- tarea -------------------------------------------------------------
  const tk = editing?.kind === 'task' ? editing.item : undefined;
  const [vague, setVague] = useState(!!tk?.vagueMonth);
  const [due, setDue] = useState(
    tk?.due ? new Date(tk.due) : withTime(new Date(), new Date(0, 0, 0, 18, 0)),
  );
  const [hasTime, setHasTime] = useState(tk?.hasTime ?? true);
  const [vagueMonth, setVagueMonth] = useState<string | null>(
    tk?.vagueMonth ?? null,
  );

  // ---- hábito ------------------------------------------------------------
  const hb = editing?.kind === 'habit' ? editing.item : undefined;
  const [freq, setFreq] = useState<HabitFreq>(hb?.freq ?? 'Diario');
  const [count, setCount] = useState(hb && isMultiFreq(hb.freq) ? hb.target : 3);
  const [habitDays, setHabitDays] = useState<number[]>(hb?.weekdays ?? []);

  // ---- avisos ------------------------------------------------------------
  const [relReminders, setRelReminders] = useState<RelReminder[]>(
    ev?.reminders ?? tk?.reminders ?? [{ id: uid('r'), value: 15, unit: 0 }],
  );
  const [timeReminders, setTimeReminders] = useState<TimeReminder[]>(
    hb?.reminders ?? [{ id: uid('r'), time: '09:00' }],
  );

  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEvent = kind === 'event';
  const isTask = kind === 'task';
  const isHabit = kind === 'habit';

  const monthChips = useMemo(() => {
    const now = new Date();
    const out = Array.from(
      { length: 5 },
      (_, i) => MONTHS[(now.getMonth() + i) % 12],
    );
    return [...out, 'Sin mes'];
  }, []);

  // ---- guardar -----------------------------------------------------------
  const canSave = title.trim().length > 0;

  const save = () => {
    if (!canSave) return;

    if (isEvent) {
      const payload: Omit<CalEvent, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        start: start.getTime(),
        end: Math.max(end.getTime(), start.getTime() + 60000),
        allDay,
        calendarId,
        availability,
        visibility,
        repeat,
        weekdays: repeat === 'Días de la semana' ? eventDays : [],
        guests,
        reminders: relReminders,
      };
      if (editing) store.updateEvent(editing.item.id, payload);
      else store.addEvent(payload);
    } else if (isTask) {
      const payload: Omit<Task, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        calendarId:
          calendars.find((c) => c.kind === 'TAREAS')?.id ?? calendarId,
        due: vague ? null : due.getTime(),
        hasTime: vague ? false : hasTime,
        vagueMonth: vague ? (vagueMonth ?? 'Sin mes') : null,
        done: tk?.done ?? false,
        reminders: relReminders,
      };
      if (editing) store.updateTask(editing.item.id, payload);
      else store.addTask(payload);
    } else {
      const payload: Omit<Habit, 'id'> = {
        name: title.trim(),
        description: description.trim(),
        freq,
        target: isMultiFreq(freq) ? count : 1,
        weekdays: isWeeklyFreq(freq) ? habitDays : [],
        reminders: timeReminders,
        progress: hb?.progress ?? 0,
        streak: hb?.streak ?? 0,
      };
      if (editing) store.updateHabit(editing.item.id, payload);
      else store.addHabit(payload);
    }

    toast.show(
      editing
        ? 'Cambios guardados'
        : isEvent
          ? 'Evento creado'
          : isTask
            ? 'Tarea creada'
            : 'Hábito creado',
    );
    close();
  };

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const remove = () => {
    if (!editing) return;
    const removed = store.removeItem(editing.kind, editing.item.id);
    setConfirmDelete(false);
    close();
    if (removed) {
      toast.showUndo('Elemento eliminado', () => store.restoreItem(removed));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 10 },
        ]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            hitSlop={hitSlopFor(30)}
            onPress={close}
            style={styles.closeBtn}>
            <XIcon size={15} color={color.textMuted} />
          </Pressable>

          <View style={styles.segmented}>
            {(
              [
                ['event', 'EVENTO'],
                ['task', 'TAREA'],
                ['habit', 'HÁBITO'],
              ] as const
            ).map(([value, label]) => {
              const on = kind === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on, disabled: !!editing }}
                  disabled={!!editing}
                  onPress={() => setKind(value)}
                  style={[
                    styles.segment,
                    on && {
                      backgroundColor: '#1b1b1f',
                      borderColor: '#2f2f36',
                    },
                  ]}>
                  <View
                    style={[
                      styles.segmentDot,
                      { backgroundColor: on ? accent : 'transparent' },
                    ]}
                  />
                  <T
                    style={{
                      fontSize: 9.5,
                      letterSpacing: 1.2,
                      color: on ? color.text : color.label,
                    }}>
                    {label}
                  </T>
                </Pressable>
              );
            })}
          </View>

          <View style={{ width: 30 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}>
          {/* Título + descripción: común a los tres tipos. */}
          <View style={styles.titleBlock}>
            <Field
              variant="bare"
              size={19}
              value={title}
              onChangeText={setTitle}
              placeholder={
                isEvent
                  ? 'Título del evento'
                  : isTask
                    ? 'Título de la tarea'
                    : 'Nombre del hábito'
              }
              style={styles.titleInput}
            />
            <Divider />
            <Field
              variant="bare"
              multiline
              size={12.5}
              value={description}
              onChangeText={setDescription}
              placeholder="Descripción"
              style={styles.descInput}
            />
          </View>

          <View style={{ gap: blockGap }}>
            {isEvent ? (
              <>
                <FormBlock
                  first
                  title="CUÁNDO"
                  right={
                    <View style={styles.switchRow}>
                      <T
                        style={[
                          styles.switchLabel,
                          { color: allDay ? color.text : color.labelDim },
                        ]}>
                        TODO EL DÍA
                      </T>
                      <Switch value={allDay} onChange={setAllDay} />
                    </View>
                  }>
                  <View style={{ gap: 7 }}>
                    {(
                      [
                        ['INICIO', start, setStart],
                        ['FIN', end, setEnd],
                      ] as const
                    ).map(([label, value, setValue]) => (
                      <FieldRow key={label} label={label}>
                        <ControlButton
                          grow
                          label={fmtLongDate(value)}
                          onPress={() =>
                            picker.open('date', value, (d) =>
                              setValue(withTime(d, value)),
                            )
                          }
                        />
                        <ControlButton
                          center
                          width={74}
                          muted={allDay}
                          label={allDay ? '—' : fmtTime(value)}
                          onPress={() => {
                            if (allDay) return;
                            picker.open('time', value, (d) =>
                              setValue(withTime(value, d)),
                            );
                          }}
                        />
                      </FieldRow>
                    ))}
                  </View>

                  <View style={{ gap: 7 }}>
                    <Label>Repetir</Label>
                    <View style={styles.wrap}>
                      {REPEATS.map((r) => (
                        <Chip
                          key={r}
                          height={29}
                          label={r}
                          selected={repeat === r}
                          onPress={() => setRepeat(r)}
                        />
                      ))}
                    </View>
                    {repeat === 'Días de la semana' ? (
                      <WeekdayChips
                        selected={eventDays}
                        onToggle={(day) => setEventDays(toggled(eventDays, day))}
                      />
                    ) : null}
                  </View>
                </FormBlock>

                <FormBlock title="CALENDARIO">
                  <View style={styles.wrap}>
                    {writable.map((c) => (
                      <Chip
                        key={c.id}
                        label={c.name}
                        dot={c.dot ?? accent}
                        selected={calendarId === c.id}
                        onPress={() => setCalendarId(c.id)}
                      />
                    ))}
                  </View>
                  <Divider />
                  <View style={{ gap: 8 }}>
                    <FieldRow label="DISPONIB." labelWidth={76}>
                      <View style={styles.optionRow}>
                        {AVAILABILITY.map((o) => (
                          <Chip
                            key={o}
                            grow
                            label={o}
                            selected={availability === o}
                            onPress={() => setAvailability(o)}
                          />
                        ))}
                      </View>
                    </FieldRow>
                    <FieldRow label="VISIBILIDAD" labelWidth={76}>
                      <View style={styles.optionRow}>
                        {VISIBILITY.map((o) => (
                          <Chip
                            key={o}
                            grow
                            label={o}
                            selected={visibility === o}
                            onPress={() => setVisibility(o)}
                          />
                        ))}
                      </View>
                    </FieldRow>
                  </View>
                </FormBlock>

                <FormBlock title="INVITAR">
                  {guests.length ? (
                    <View style={{ gap: 6 }}>
                      {guests.map((g) => (
                        <View key={g.id} style={styles.guestRow}>
                          <Avatar initial={g.initial} />
                          <T numberOfLines={1} style={styles.guestName}>
                            {g.name}
                          </T>
                          <T style={styles.guestState}>{g.state}</T>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Quitar a ${g.name}`}
                            hitSlop={hitSlopFor(24)}
                            onPress={() =>
                              setGuests((list) =>
                                list.filter((x) => x.id !== g.id),
                              )
                            }
                            style={styles.removeBtn}>
                            <XIcon size={12} color="#4a4a52" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <DashedButton
                    label="AÑADIR INVITADO"
                    icon={<UserPlusIcon size={13} color={color.textMuted} />}
                    onPress={() => setGuestSheet(true)}
                  />
                </FormBlock>
              </>
            ) : null}

            {isTask ? (
              <FormBlock
                first
                title="VENCE"
                right={
                  <View style={styles.switchRow}>
                    <T
                      style={[
                        styles.switchLabel,
                        { color: vague ? color.text : color.labelDim },
                      ]}>
                      SIN FECHA EXACTA
                    </T>
                    <Switch value={vague} onChange={setVague} />
                  </View>
                }>
                {vague ? (
                  <View style={styles.wrap}>
                    {monthChips.map((m) => (
                      <Chip
                        key={m}
                        label={m}
                        selected={vagueMonth === m}
                        onPress={() => setVagueMonth(m)}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={{ gap: 9 }}>
                    <FieldRow label="DÍA">
                      <ControlButton
                        grow
                        label={fmtLongDate(due)}
                        onPress={() =>
                          picker.open('date', due, (d) =>
                            setDue(withTime(d, due)),
                          )
                        }
                      />
                    </FieldRow>
                    <FieldRow label="HORA">
                      <ControlButton
                        grow
                        muted={!hasTime}
                        label={hasTime ? fmtTime(due) : 'Sin hora'}
                        icon={<ClockIcon size={13} color={color.labelDim} />}
                        onPress={() =>
                          picker.open('time', due, (d) => {
                            setDue(withTime(due, d));
                            setHasTime(true);
                          })
                        }
                      />
                    </FieldRow>
                    {hasTime ? (
                      <Pressable
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={() => setHasTime(false)}
                        style={styles.clearTime}>
                        <T style={styles.clearTimeLabel}>QUITAR LA HORA</T>
                      </Pressable>
                    ) : null}
                  </View>
                )}
              </FormBlock>
            ) : null}

            {isHabit ? (
              <FormBlock first title="TEMPORALIDAD">
                <View style={styles.wrap}>
                  {FREQS.map((f) => (
                    <Chip
                      key={f}
                      label={f}
                      selected={freq === f}
                      onPress={() => setFreq(f)}
                    />
                  ))}
                </View>

                {isMultiFreq(freq) ? (
                  <>
                    <View style={styles.counterRow}>
                      <T style={styles.counterLabel}>
                        {freq === 'X por día'
                          ? 'Veces al día'
                          : 'Veces por semana'}
                      </T>
                      <View style={styles.counter}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Quitar una"
                          onPress={() => setCount((c) => Math.max(2, c - 1))}
                          style={({ pressed }) => [
                            styles.counterBtn,
                            pressed && { borderColor: accent },
                          ]}>
                          <T style={styles.counterSign}>−</T>
                        </Pressable>
                        <T style={styles.counterValue}>{count}</T>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Añadir una"
                          onPress={() => setCount((c) => Math.min(10, c + 1))}
                          style={({ pressed }) => [
                            styles.counterBtn,
                            pressed && { borderColor: accent },
                          ]}>
                          <T style={styles.counterSign}>+</T>
                        </Pressable>
                      </View>
                    </View>
                    <View style={styles.markerRow}>
                      {Array.from({ length: count }, (_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.marker,
                            { borderColor: accent, backgroundColor: accent },
                          ]}
                        />
                      ))}
                      <T style={styles.markerLabel}>MARCADORES EN LA TARJETA</T>
                    </View>
                  </>
                ) : null}

                {isWeeklyFreq(freq) ? (
                  <View style={{ gap: 7 }}>
                    <Label>Días</Label>
                    <WeekdayChips
                      selected={habitDays}
                      onToggle={(day) => setHabitDays(toggled(habitDays, day))}
                    />
                  </View>
                ) : null}
              </FormBlock>
            ) : null}

            {/* Notificaciones: común, siempre cierra el grupo. */}
            {isHabit ? (
              <RemindersBlock
                kind="time"
                reminders={timeReminders}
                unitLabel={
                  isWeeklyFreq(freq) ? 'EN LOS DÍAS MARCADOS' : 'CADA DÍA'
                }
                onChange={setTimeReminders}
                onAdded={revealLast}
                onPickTime={(current, apply) => {
                  const [h, m] = current.split(':').map(Number);
                  picker.open('time', new Date(2000, 0, 1, h, m), (d) =>
                    apply(fmtTime(d)),
                  );
                }}
              />
            ) : (
              <RemindersBlock
                kind="relative"
                reminders={relReminders}
                onChange={setRelReminders}
                onAdded={revealLast}
              />
            )}
          </View>

          {editing ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmDelete(true)}
              style={({ pressed }) => [
                styles.deleteRow,
                pressed && { backgroundColor: alpha(accent, 0.08) },
              ]}>
              <TrashIcon size={15} color={accent} />
              <T style={[styles.deleteLabel, { color: accent }]}>Eliminar</T>
            </Pressable>
          ) : null}
        </ScrollView>

        <Cta
          primary
          disabled={!canSave}
          label={
            editing
              ? 'GUARDAR CAMBIOS'
              : isEvent
                ? 'CREAR EVENTO'
                : isTask
                  ? 'CREAR TAREA'
                  : 'CREAR HÁBITO'
          }
          onPress={save}
        />
      </View>

      <Sheet
        open={guestSheet}
        onClose={() => setGuestSheet(false)}
        title="Añadir invitado">
        <Field
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="nombre o correo"
          value={guestName}
          onChangeText={setGuestName}
        />
        <Cta
          primary
          disabled={!guestName.trim()}
          label="INVITAR"
          onPress={() => {
            const name = guestName.trim();
            setGuests((list) => [
              ...list,
              {
                id: uid('g'),
                name,
                initial: (name[0] ?? '?').toUpperCase(),
                state: 'PENDIENTE',
              },
            ]);
            setGuestName('');
            setGuestSheet(false);
          }}
        />
      </Sheet>

      <Sheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Eliminar">
        <T style={styles.confirmText}>
          Se quitará de la app. Tendrás cinco segundos para deshacerlo.
        </T>
        <Cta primary label="ELIMINAR" onPress={remove} />
      </Sheet>

      {picker.element}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  screen: { flex: 1, paddingHorizontal: space.screen, gap: 10 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
    backgroundColor: color.surface,
    borderRadius: 15,
    padding: 4,
  },
  segment: {
    flex: 1,
    height: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  segmentDot: { width: 4, height: 4, borderRadius: 2 },
  scroll: { gap: 10, paddingBottom: 4 },
  titleBlock: {
    backgroundColor: color.surface,
    borderRadius: radius.box,
    paddingVertical: 15,
    paddingHorizontal: 16,
    gap: 10,
  },
  titleInput: { letterSpacing: -0.3, minHeight: 26 },
  descInput: { minHeight: 36, lineHeight: 18, color: '#b9b9c1' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 9, letterSpacing: 1.2 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  optionRow: { flex: 1, flexDirection: 'row', gap: 4 },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 36 },
  guestName: { flex: 1, fontSize: 12.5, color: color.textSoft },
  guestState: { fontSize: 9, letterSpacing: 1.1, color: color.labelDim },
  removeBtn: {
    width: 26,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearTime: { alignSelf: 'flex-start', paddingLeft: 54 },
  clearTimeLabel: { fontSize: 8.5, letterSpacing: 1.1, color: color.faint },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterLabel: { flex: 1, fontSize: 11.5, color: '#b9b9c1' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  counterBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.borderStrong,
    backgroundColor: color.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterSign: { fontSize: 15, color: '#c9c9d0' },
  counterValue: { width: 26, textAlign: 'center', fontSize: 15 },
  markerRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  marker: { width: 6, height: 6, borderRadius: 3, borderWidth: 1 },
  markerLabel: {
    fontSize: 8.5,
    letterSpacing: 1.1,
    color: color.labelDim,
    paddingLeft: 5,
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: radius.card,
    marginTop: 2,
  },
  deleteLabel: { fontSize: 12.5 },
  confirmText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#b9b9c1',
    paddingHorizontal: 4,
  },
});
