import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { CalendarPickerSheet } from '@/features/calendars/CalendarPickerSheet';
import { formatTime } from '@/lib/date';
import { isWeeklyFrequency } from '@/lib/habits';
import { looksLikeEmail } from '@/lib/text';
import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import {
  alpha,
  color,
  duration,
  hitSlopFor,
  radius,
  space,
  tint,
} from '@/theme/tokens';
import { Field } from '@/ui/Field';
import { Sheet } from '@/ui/Sheet';
import { Cta, Divider, OptionRow } from '@/ui/controls';
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

/** The three item types, with the translation key of their tab label. */
const KINDS: { value: ItemKind; labelKey: string }[] = [
  { value: 'event', labelKey: 'kindEvent' },
  { value: 'task', labelKey: 'kindTask' },
  { value: 'habit', labelKey: 'kindHabit' },
];

/**
 * Translation keys of the title placeholder and CTA per type, to avoid
 * repeating the same chain of conditions.
 */
const COPY_KEYS: Record<ItemKind, { placeholder: string; cta: string }> = {
  event: { placeholder: 'eventTitlePlaceholder', cta: 'createEventCta' },
  task: { placeholder: 'taskTitlePlaceholder', cta: 'createTaskCta' },
  habit: { placeholder: 'habitNamePlaceholder', cta: 'createHabitCta' },
};

/** Side of the close button in the top bar. */
const CLOSE_SIZE = 30;

/** Delay before scrolling down: gives the new row time to mount. */
const REVEAL_DELAY_MS = 60;

/**
 * Translation keys of what each scope is called, and what it does, per
 * action.
 *
 * Saving and deleting are told apart because the same word would be a
 * different promise: "todas" on a save rewrites the whole repetition, and on
 * a delete it takes it away. The hint is the one that makes the choice safe
 * to make quickly.
 */
const SCOPE_COPY_KEYS: Record<
  'save' | 'remove',
  { title: string; occurrence: string; series: string; hint: string }
> = {
  save: {
    title: 'saveScopeTitle',
    occurrence: 'saveScopeOccurrence',
    series: 'saveScopeSeries',
    hint: 'saveScopeHint',
  },
  remove: {
    title: 'removeScopeTitle',
    occurrence: 'removeScopeOccurrence',
    series: 'removeScopeSeries',
    hint: 'removeScopeHint',
  },
};

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
 * Editing an item shows no button at all, and holds no space for one either,
 * until something about it actually differs from what the screen opened with:
 * `useItemForm` decides that, not this file. Opening an item is purely
 * looking at it, the ScrollView above takes the room a button would have used,
 * and a button only turns up, taking that room back, once there is something
 * to save. Creating one is the older rule: the button is there from the start,
 * disabled until the title is filled in.
 *
 * The sheets live here rather than inside the blocks: they have to sit above the
 * form, not inside the list that scrolls.
 *
 * State and save rules live in `useItemForm`; this file only draws.
 */
export function ItemForm({ editing }: { editing?: Editing }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const prefs = usePrefs();
  const picker = useDateTimePicker();
  const form = useItemForm(editing);

  const scrollRef = useRef<ScrollView>(null);
  const [guestSheetOpen, setGuestSheetOpen] = useState(false);
  const [calendarSheetOpen, setCalendarSheetOpen] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
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
    form.event.addGuest(guestEmail.trim());
    setGuestEmail('');
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
            accessibilityLabel={t('create.closeLabel')}
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
              {t('create.readOnlyNote')}
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
                  onPickCalendar={() => setCalendarSheetOpen(true)}
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
                    ? t('create.habitReminderWeeklyUnit')
                    : t('create.habitReminderDailyUnit')
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
              /**
               * A repetition goes straight to the scope sheet: that sheet is
               * already the confirmation, and it says the one thing this one
               * would get wrong, which is that there is no undo.
               */
              onPress={() =>
                form.series.asks ? form.remove() : setConfirmDelete(true)
              }
              style={({ pressed }) => [
                styles.deleteRow,
                pressed && { backgroundColor: alpha(accent, tint.danger) },
              ]}>
              <TrashIcon size={15} color={accent} />
              <AppText style={[styles.deleteLabel, { color: accent }]}>
                {t('create.deleteRowLabel')}
              </AppText>
            </Pressable>
          ) : null}
        </ScrollView>

        {form.isEditing ? (
          /**
           * No slot is reserved for this: the ScrollView above has no fixed
           * height of its own, so it simply shrinks to fit whatever the rest of
           * the screen leaves it, and removing this element gives the room
           * straight back to the event.
           */
          form.canSave ? (
            <Animated.View
              entering={
                prefs.motionOff ? undefined : FadeIn.duration(duration.state)
              }
              exiting={
                prefs.motionOff ? undefined : FadeOut.duration(duration.press)
              }>
              <Cta
                primary
                label={
                  form.readOnly
                    ? t('create.saveNotificationsCta')
                    : t('create.saveChangesCta')
                }
                onPress={form.save}
              />
            </Animated.View>
          ) : null
        ) : (
          <Cta
            primary
            disabled={!form.canSave}
            label={t(`create.${COPY_KEYS[form.kind].cta}`)}
            onPress={form.save}
          />
        )}
      </View>

      <Sheet
        open={guestSheetOpen}
        onClose={() => setGuestSheetOpen(false)}
        title={t('create.addGuestSheetTitle')}>
        <Field
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder={t('create.guestEmailPlaceholder')}
          value={guestEmail}
          onChangeText={setGuestEmail}
        />
        <Cta
          primary
          disabled={!looksLikeEmail(guestEmail)}
          label={t('create.inviteCta')}
          onPress={confirmGuest}
        />
      </Sheet>

      <CalendarPickerSheet
        open={calendarSheetOpen}
        title={t('create.eventCalendarSheetTitle')}
        options={form.calendarOptions}
        selectedId={form.event.calendarId}
        onSelect={form.event.setCalendarId}
        onClose={() => setCalendarSheetOpen(false)}
      />

      <Sheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t('create.deleteConfirmTitle')}>
        <AppText style={styles.confirmText}>
          {t('create.deleteConfirmText')}
        </AppText>
        <Cta primary label={t('create.deleteCta')} onPress={form.remove} />
      </Sheet>

      <ScopeSheet series={form.series} />

      {picker.element}
    </KeyboardAvoidingView>
  );
}

/**
 * Asks what a save or a delete on one occurrence of a repetition reaches.
 *
 * The scopes arrive already filtered to the ones that action can honour. With
 * only one of them left the sheet stops being a choice and becomes a warning of
 * what is about to happen, which is the case of a save on Android, and that is
 * still worth showing, because rewriting a whole repetition is not what someone
 * pressing GUARDAR CAMBIOS on a Tuesday necessarily has in mind.
 */
function ScopeSheet({ series }: { series: ItemFormState['series'] }) {
  const { t } = useTranslation();
  const copyKeys = SCOPE_COPY_KEYS[series.asked ?? 'save'];

  return (
    <Sheet
      open={series.asked !== null}
      onClose={series.dismiss}
      title={t(`create.${copyKeys.title}`)}>
      <AppText style={styles.confirmText}>{t(`create.${copyKeys.hint}`)}</AppText>
      <View style={styles.options}>
        {series.scopes.map((scope) => (
          <OptionRow
            key={scope}
            label={t(
              `create.${scope === 'occurrence' ? copyKeys.occurrence : copyKeys.series}`,
            )}
            selected={false}
            onPress={() => series.choose(scope)}
          />
        ))}
      </View>
    </Sheet>
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
  const { t } = useTranslation();
  const accent = useAccent();

  return (
    <View style={styles.tabs}>
      {KINDS.map(({ value, labelKey }) => {
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
              {t(`create.${labelKey}`)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Title and description, common to the three item types. */
function TitleBlock({ form }: { form: ItemFormState }) {
  const { t } = useTranslation();

  return (
    <View style={styles.titleBlock}>
      <Field
        variant="bare"
        fontSize={19}
        value={form.title}
        onChangeText={form.setTitle}
        placeholder={t(`create.${COPY_KEYS[form.kind].placeholder}`)}
        style={styles.titleInput}
      />
      <Divider />
      <Field
        variant="bare"
        multiline
        value={form.description}
        onChangeText={form.setDescription}
        placeholder={t('create.descriptionPlaceholder')}
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
  options: { gap: 2 },
});
