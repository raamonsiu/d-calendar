import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { taskDueLabel } from '@/store/selectors';
import { AppText } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color, radius } from '@/theme/tokens';
import { CheckIcon } from '@/ui/icons';
import type { Task } from '@/types';
import { ItemSettingsButton } from './ItemSettingsButton';

/** Side of the button that opens the task detail. */
const SETTINGS_SIZE = 28;

type TaskRowProps = {
  task: Task;
  onToggle: () => void;
  onOpenSettings: () => void;
};

/**
 * Task row on Home (handoff §5): completion circle, title and the due label.
 *
 * Tapping the row completes or uncompletes the task; once done, the title is
 * struck through with the accent and dimmed. The label on the right only
 * appears when the task has a date or an approximate month.
 */
export function TaskRow({ task, onToggle, onOpenSettings }: TaskRowProps) {
  const accent = useAccent();
  const dueLabel = taskDueLabel(task);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: task.done }}
      accessibilityLabel={task.title}
      hitSlop={{ top: 6, bottom: 6 }}
      onPress={() => {
        Haptics.selectionAsync();
        onToggle();
      }}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: color.hairline },
      ]}>
      <View
        style={[
          styles.check,
          {
            borderColor: task.done ? accent : color.outline,
            backgroundColor: task.done ? accent : 'transparent',
          },
        ]}>
        {task.done ? (
          <CheckIcon size={12} color={color.text} weight="bold" />
        ) : null}
      </View>

      <AppText
        numberOfLines={1}
        style={[
          styles.title,
          {
            color: task.done ? color.textDisabled : color.textBody,
            textDecorationLine: task.done ? 'line-through' : 'none',
            textDecorationColor: accent,
          },
        ]}>
        {task.title}
      </AppText>

      {dueLabel ? <AppText style={styles.due}>{dueLabel}</AppText> : null}

      <ItemSettingsButton
        label="Ajustes de la tarea"
        size={SETTINGS_SIZE}
        onPress={onOpenSettings}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    height: 42,
    paddingHorizontal: 4,
    borderRadius: radius.chip,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 13.5, letterSpacing: -0.1 },
  due: { fontSize: 9.5, letterSpacing: 0.8, color: color.labelDim },
});
