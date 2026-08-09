import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatTime } from '@/lib/date';
import { isWeeklyFrequency } from '@/lib/habits';
import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import {
  alpha,
  color,
  hitSlopFor,
  radius,
  space,
  tint,
} from '@/theme/tokens';
import { Field } from '@/ui/Field';
import { Sheet } from '@/ui/Sheet';
import { Cta, Divider } from '@/ui/controls';
import { TrashIcon, XIcon } from '@/ui/icons';
import { useDateTimePicker } from '@/ui/pickers';
import type { ItemKind } from '@/types';
import { EventBlocks } from './EventBlocks';
import { HabitBlock } from './HabitBlock';
import { RemindersBlock } from './RemindersBlock';
import { TaskBlock } from './TaskBlock';
import { BLOCK_GAP } from './blocks';
import { useItemForm, type Editing, type ItemFormState } from './useItemForm';

export type { Editing } from './useItemForm';

/** The three item types, with the label of their tab. */
const KINDS: { value: ItemKind; label: string }[] = [
  { value: 'event', label: 'EVENTO' },
  { value: 'task', label: 'TAREA' },
  { value: 'habit', label: 'HÁBITO' },
];

/** Title and CTA per type, to avoid repeating the same chain of conditions. */
const COPY: Record<ItemKind, { placeholder: string; cta: string }> = {
  event: { placeholder: 'Título del evento', cta: 'CREAR EVENTO' },
  task: { placeholder: 'Título de la tarea', cta: 'CREAR TAREA' },
  habit: { placeholder: 'Nombre del hábito', cta: 'CREAR HÁBITO' },
};

/** Side of the close button in the top bar. */
const CLOSE_SIZE = 30;

/** Delay before scrolling down: gives the new row time to mount. */
const REVEAL_DELAY_MS = 60;

/**
 * Form for an event, a task or a habit.
 *
 * It is the same screen in three modes: without `editing` it creates a new item
 * and the type selector is active; with `editing` it edits the given item,
 * locks the type (an event does not become a task) and adds Eliminar; and when
 * the item belongs to somebody else it is only shown, with a line saying why and
 * no Eliminar.
 *
 * Read only turns the form off in one stroke, wrapping the blocks in a view that
 * takes no touches, instead of disabling control by control: no field, chip or
 * picker responds, and the list still scrolls, because the ScrollView is the one
 * that keeps receiving the gesture.
 *
 * The reminders are left outside that view on purpose, and the button says
 * GUARDAR AVISOS: they belong to the app rather than to the event, so they can
 * be changed on an event the app may not touch.
 *
 * State and save rules live in `useItemForm`; this file only draws.
 */
export function ItemForm({ editing }: { editing?: Editing }) {
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const prefs = usePrefs();
  const picker = useDateTimePicker();
  const form = useItemForm(editing);

  const scrollRef = useRef<ScrollView>(null);
  const [guestSheetOpen, setGuestSheetOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  /**
   * Reminders are appended at the end of the last box, which may sit off
   * screen. After adding one, the form scrolls down so it becomes visible.
   */
  const revealLast = () => {
    setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: !prefs.motionOff }),
      REVEAL_DELAY_MS,
    );
  };

  const confirmGuest = () => {
    form.event.addGuest(guestName.trim());
    setGuestName('');
    setGuestSheetOpen(false);
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
            hitSlop={hitSlopFor(CLOSE_SIZE)}
            onPress={form.close}
            style={styles.close}>
            <XIcon size={15} color={color.textMuted} />
          </Pressable>

          <KindTabs
            kind={form.kind}
            locked={form.isEditing}
            onChange={form.setKind}
          />

          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}>
          {form.readOnly ? (
            <AppText style={styles.readOnlyNote}>
              Este evento lo creó otra persona: se ve, pero se edita donde se
              creó. Los avisos sí son tuyos y puedes cambiarlos.
            </AppText>
          ) : null}

          <View pointerEvents={form.readOnly ? 'none' : 'auto'}>
            <TitleBlock form={form} />
          </View>

          <View style={styles.blocks}>
            <View
              style={styles.blocks}
              pointerEvents={form.readOnly ? 'none' : 'auto'}>
              {form.kind === 'event' ? (
                <EventBlocks
                  form={form}
                  picker={picker}
                  onAddGuest={() => setGuestSheetOpen(true)}
                />
              ) : null}

              {form.kind === 'task' ? (
                <TaskBlock form={form} picker={picker} />
              ) : null}

              {form.kind === 'habit' ? <HabitBlock form={form} /> : null}
            </View>

            {form.kind === 'habit' ? (
              <RemindersBlock
                kind="time"
                reminders={form.reminders.times}
                unitLabel={
                  isWeeklyFrequency(form.habit.frequency)
                    ? 'EN LOS DÍAS MARCADOS'
                    : 'CADA DÍA'
                }
                onChange={form.reminders.setTimes}
                onAdded={revealLast}
                onPickTime={(current, apply) => {
                  const [hour, minute] = current.split(':').map(Number);
                  picker.open(
                    'time',
                    new Date(2000, 0, 1, hour, minute),
                    (picked) => apply(formatTime(picked)),
                  );
                }}
              />
            ) : (
              <RemindersBlock
                kind="relative"
                reminders={form.reminders.relative}
                onChange={form.reminders.setRelative}
                onAdded={revealLast}
              />
            )}
          </View>

          {form.isEditing && !form.readOnly ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmDelete(true)}
              style={({ pressed }) => [
                styles.deleteRow,
                pressed && { backgroundColor: alpha(accent, tint.danger) },
              ]}>
              <TrashIcon size={15} color={accent} />
              <AppText style={[styles.deleteLabel, { color: accent }]}>
                Eliminar
              </AppText>
            </Pressable>
          ) : null}
        </ScrollView>

        {form.readOnly ? (
          <Cta primary label="GUARDAR AVISOS" onPress={form.save} />
        ) : (
          <Cta
            primary
            disabled={!form.canSave}
            label={form.isEditing ? 'GUARDAR CAMBIOS' : COPY[form.kind].cta}
            onPress={form.save}
          />
        )}
      </View>

      <Sheet
        open={guestSheetOpen}
        onClose={() => setGuestSheetOpen(false)}
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
          onPress={confirmGuest}
        />
      </Sheet>

      <Sheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Eliminar">
        <AppText style={styles.confirmText}>
          Se quitará de la app. Tendrás cinco segundos para deshacerlo.
        </AppText>
        <Cta primary label="ELIMINAR" onPress={form.remove} />
      </Sheet>

      {picker.element}
    </KeyboardAvoidingView>
  );
}

/**
 * Item type selector. `locked` leaves it visible but inert, which is what the
 * detail of an already existing item needs.
 */
function KindTabs({
  kind,
  locked,
  onChange,
}: {
  kind: ItemKind;
  locked: boolean;
  onChange: (next: ItemKind) => void;
}) {
  const accent = useAccent();

  return (
    <View style={styles.tabs}>
      {KINDS.map(({ value, label }) => {
        const selected = kind === value;
        return (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled: locked }}
            disabled={locked}
            onPress={() => onChange(value)}
            style={[styles.tab, selected && styles.tabSelected]}>
            <View
              style={[
                styles.tabDot,
                { backgroundColor: selected ? accent : 'transparent' },
              ]}
            />
            <AppText
              style={{
                fontSize: 9.5,
                letterSpacing: 1.2,
                color: selected ? color.text : color.label,
              }}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Title and description, common to the three item types. */
function TitleBlock({ form }: { form: ItemFormState }) {
  return (
    <View style={styles.titleBlock}>
      <Field
        variant="bare"
        fontSize={19}
        value={form.title}
        onChangeText={form.setTitle}
        placeholder={COPY[form.kind].placeholder}
        style={styles.titleInput}
      />
      <Divider />
      <Field
        variant="bare"
        multiline
        value={form.description}
        onChangeText={form.setDescription}
        placeholder="Descripción"
        style={styles.descriptionInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.background },
  screen: { flex: 1, paddingHorizontal: space.screen, gap: 10 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 2,
  },
  topBarSpacer: { width: CLOSE_SIZE },
  close: {
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
    borderRadius: radius.tap,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
    backgroundColor: color.surface,
    borderRadius: radius.segment,
    padding: 4,
  },
  tab: {
    flex: 1,
    height: 30,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  tabSelected: { backgroundColor: color.control, borderColor: color.edge },
  tabDot: { width: 4, height: 4, borderRadius: 2 },
  scroll: { gap: 10, paddingBottom: 4 },
  blocks: { gap: BLOCK_GAP },
  titleBlock: {
    backgroundColor: color.surface,
    borderRadius: radius.box,
    paddingVertical: 15,
    paddingHorizontal: 16,
    gap: 10,
  },
  titleInput: { letterSpacing: -0.3, minHeight: 26 },
  descriptionInput: { minHeight: 36, lineHeight: 18, color: color.textNote },
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
  readOnlyNote: {
    fontSize: 11,
    lineHeight: 16,
    color: color.textMuted,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  confirmText: {
    fontSize: 12,
    lineHeight: 18,
    color: color.textNote,
    paddingHorizontal: 4,
  },
});
