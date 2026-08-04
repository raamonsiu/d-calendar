import { Pressable, StyleSheet, View } from 'react-native';

import { formatLongDate, formatTime, withTime } from '@/lib/date';
import { AppText } from '@/theme/Text';
import { color } from '@/theme/tokens';
import { Chip } from '@/ui/Chip';
import { ClockIcon } from '@/ui/icons';
import type { DateTimePicker } from '@/ui/pickers';
import {
  BlockSwitch,
  ChipWrap,
  ControlButton,
  FieldRow,
  FormBlock,
} from './blocks';
import type { ItemFormState } from './useItemForm';

/** Indent of the clear-time link, to line it up with the controls. */
const CLEAR_INDENT = 54;

/**
 * Due date box of a task.
 *
 * With "SIN FECHA EXACTA" the day and time controls are swapped for the
 * approximate month chips. With an exact date, the clear-time link only appears
 * while there is a time set; tapping the time control again brings it back.
 */
export function TaskBlock({
  form,
  picker,
}: {
  form: ItemFormState;
  picker: DateTimePicker;
}) {
  const { task } = form;

  return (
    <FormBlock
      first
      title="VENCE"
      right={
        <BlockSwitch
          label="SIN FECHA EXACTA"
          value={task.vague}
          onChange={task.setVague}
        />
      }>
      {task.vague ? (
        <ChipWrap>
          {task.monthOptions.map((month) => (
            <Chip
              key={month}
              label={month}
              selected={task.vagueMonth === month}
              onPress={() => task.setVagueMonth(month)}
            />
          ))}
        </ChipWrap>
      ) : (
        <View style={styles.rows}>
          <FieldRow label="DÍA">
            <ControlButton
              grow
              label={formatLongDate(task.dueAt)}
              onPress={() =>
                picker.open('date', task.dueAt, (picked) =>
                  task.setDueAt(withTime(picked, task.dueAt)),
                )
              }
            />
          </FieldRow>

          <FieldRow label="HORA">
            <ControlButton
              grow
              muted={!task.hasTime}
              label={task.hasTime ? formatTime(task.dueAt) : 'Sin hora'}
              icon={<ClockIcon size={13} color={color.labelDim} />}
              onPress={() =>
                picker.open('time', task.dueAt, (picked) => {
                  task.setDueAt(withTime(task.dueAt, picked));
                  task.setHasTime(true);
                })
              }
            />
          </FieldRow>

          {task.hasTime ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => task.setHasTime(false)}
              style={styles.clearTime}>
              <AppText style={styles.clearTimeLabel}>QUITAR LA HORA</AppText>
            </Pressable>
          ) : null}
        </View>
      )}
    </FormBlock>
  );
}

const styles = StyleSheet.create({
  rows: { gap: 9 },
  clearTime: { alignSelf: 'flex-start', paddingLeft: CLEAR_INDENT },
  clearTimeLabel: { fontSize: 8.5, letterSpacing: 1.1, color: color.faint },
});
