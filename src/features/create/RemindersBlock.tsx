import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { nextInCycle, patchById, withoutId } from '@/lib/collections';
import { formatTime } from '@/lib/date';
import { countLabel } from '@/lib/text';
import { createId } from '@/store/useAppStore';
import { AppText } from '@/theme/Text';
import { color, hitSlopFor, radius, size } from '@/theme/tokens';
import { DashedButton } from '@/ui/controls';
import { BellIcon, PlusIcon, XIcon } from '@/ui/icons';
import type { RelativeReminder, ReminderUnit, TimeReminder } from '@/types';
import { ControlButton, FormBlock } from './blocks';

/** Translation keys of a relative reminder's unit, in `ReminderUnit` order. */
const RELATIVE_UNIT_KEYS = ['minutesBefore', 'hoursBefore', 'daysBefore'];

/**
 * Values the control cycles through, one list per unit.
 *
 * The step belongs to the unit and not to the control: five minutes is a
 * sensible jump, five hours or five days is not, which is why a single list
 * shared by the three of them offered "45 days before" and never offered "1
 * hour before". Minutes move in fives; hours and days start at one and open
 * up as they grow, so the usual reminders are two taps away and the long ones
 * are still reachable without cycling through twenty-three of them.
 */
const RELATIVE_VALUES: Record<ReminderUnit, number[]> = {
  0: [5, 10, 15, 30, 45],
  1: [1, 2, 3, 6, 12],
  2: [1, 2, 3, 7, 14],
};

/** Starting values of a new reminder. */
const NEW_RELATIVE_VALUE = 30;
const NEW_REMINDER_HOUR = 21;

/** Widths of the controls in the row. */
const VALUE_WIDTH = 62;
const TIME_WIDTH = 72;

type CommonProps = {
  /** Called after adding, so the form scrolls down to the new reminder. */
  onAdded: () => void;
};

type RelativeProps = CommonProps & {
  kind: 'relative';
  reminders: RelativeReminder[];
  onChange: (next: RelativeReminder[]) => void;
};

type TimeProps = CommonProps & {
  kind: 'time';
  reminders: TimeReminder[];
  onChange: (next: TimeReminder[]) => void;
  /** Label on the right: depends on whether the habit is weekly. */
  unitLabel: string;
  /** Opens the form's time picker with the current value of the row. */
  onPickTime: (current: string, apply: (time: string) => void) => void;
};

/**
 * Notifications box, the last one of the form in all three types.
 *
 * Events and tasks remind you "n minutes, hours or days before"; habits remind
 * you at times of day. Both variants share the box, the header counter and the
 * row, and only the controls in the middle change.
 */
export function RemindersBlock(props: RelativeProps | TimeProps) {
  const { t } = useTranslation();
  const summary =
    props.kind === 'time'
      ? countLabel(
          props.reminders.length,
          t('create.hourSingular'),
          t('create.hourPlural'),
        )
      : countLabel(
          props.reminders.length,
          t('create.reminderSingular'),
          t('create.reminderPlural'),
        );

  const addReminder = () => {
    if (props.kind === 'time') {
      props.onChange([
        ...props.reminders,
        {
          id: createId('r'),
          time: formatTime(new Date(2000, 0, 1, NEW_REMINDER_HOUR, 0)),
        },
      ]);
    } else {
      props.onChange([
        ...props.reminders,
        { id: createId('r'), value: NEW_RELATIVE_VALUE, unit: 0 },
      ]);
    }
    props.onAdded();
  };

  return (
    <FormBlock
      last
      title={t('create.notificationsTitle')}
      right={<AppText style={styles.summary}>{summary}</AppText>}>
      <View style={styles.list}>
        {props.kind === 'time'
          ? props.reminders.map((reminder) => (
              <ReminderRow
                key={reminder.id}
                removeLabel={t('create.removeHourLabel')}
                onRemove={() =>
                  props.onChange(withoutId(props.reminders, reminder.id))
                }>
                <ControlButton
                  center
                  height={size.controlSmall}
                  width={TIME_WIDTH}
                  label={reminder.time}
                  onPress={() =>
                    props.onPickTime(reminder.time, (time) =>
                      props.onChange(
                        patchById(props.reminders, reminder.id, { time }),
                      ),
                    )
                  }
                />
                <View style={styles.unit}>
                  <AppText numberOfLines={1} style={styles.unitLabel}>
                    {props.unitLabel}
                  </AppText>
                </View>
              </ReminderRow>
            ))
          : props.reminders.map((reminder) => (
              <ReminderRow
                key={reminder.id}
                removeLabel={t('create.removeReminderLabel')}
                onRemove={() =>
                  props.onChange(withoutId(props.reminders, reminder.id))
                }>
                <ControlButton
                  center
                  height={size.controlSmall}
                  width={VALUE_WIDTH}
                  label={String(reminder.value)}
                  onPress={() =>
                    props.onChange(
                      patchById(props.reminders, reminder.id, {
                        value: nextInCycle(
                          RELATIVE_VALUES[reminder.unit],
                          reminder.value,
                        ),
                      }),
                    )
                  }
                />
                <ControlButton
                  grow
                  height={size.controlSmall}
                  label={t(`create.${RELATIVE_UNIT_KEYS[reminder.unit]}`)}
                  onPress={() =>
                    props.onChange(
                      patchById(props.reminders, reminder.id, {
                        ...inUnit(reminder.value, nextUnit(reminder.unit)),
                      }),
                    )
                  }
                />
              </ReminderRow>
            ))}
      </View>

      <DashedButton
        label={
          props.kind === 'time'
            ? t('create.addHourLabel')
            : t('create.addReminderLabel')
        }
        icon={<PlusIcon size={12} color={color.textMuted} />}
        onPress={addReminder}
      />
    </FormBlock>
  );
}

/**
 * Next unit of a relative reminder, wrapping around after the last one.
 *
 * Postcondition: the result is always a valid `ReminderUnit`.
 *
 * @param unit Unit currently on screen.
 */
function nextUnit(unit: ReminderUnit) {
  return ((unit + 1) % RELATIVE_UNIT_KEYS.length) as ReminderUnit;
}

/**
 * A reminder moved to another unit, with its number brought into that unit's
 * own list.
 *
 * Changing the unit alone would carry the number with it, and the number
 * belonged to the unit it was chosen in: 45 minutes became 45 hours, which
 * that control cannot even reach on its own.
 *
 * Postcondition: `value` is always one of `RELATIVE_VALUES[unit]`, keeping
 * the closest one to what was on screen so the jump is as small as possible.
 *
 * @param value Number as it stood in the previous unit.
 * @param unit Unit being moved to.
 */
function inUnit(value: number, unit: ReminderUnit) {
  const allowed = RELATIVE_VALUES[unit];
  const closest = allowed.reduce((best, candidate) =>
    Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best,
  );
  return { unit, value: closest };
}

/**
 * A reminder row: the bell, whatever controls the caller passes in, and the
 * remove button.
 */
function ReminderRow({
  removeLabel,
  onRemove,
  children,
}: {
  removeLabel: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <BellIcon size={13} color={color.iconFaint} />
      {children}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={removeLabel}
        hitSlop={hitSlopFor(30)}
        onPress={onRemove}
        style={styles.remove}>
        <XIcon size={13} color={color.iconFaint} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { fontSize: 9, letterSpacing: 1.2, color: color.faint },
  list: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unit: {
    flex: 1,
    height: size.controlSmall,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.card,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  unitLabel: { fontSize: 11.5, letterSpacing: 0.3, color: color.textNote },
  remove: {
    width: 26,
    height: 30,
    borderRadius: radius.joined,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
