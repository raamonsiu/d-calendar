import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { taskMeta } from '@/store/selectors';
import { T } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color, hitSlopFor } from '@/theme/tokens';
import { CheckIcon, SlidersHorizontalIcon } from '@/ui/icons';
import type { Task } from '@/types';

type Props = {
  task: Task;
  onToggle: () => void;
  onOpenSettings: () => void;
};

/** Fila de tarea: 42px de alto, 54 de área táctil (handoff §5). */
export function TaskRow({ task, onToggle, onOpenSettings }: Props) {
  const accent = useAccent();
  const meta = taskMeta(task);

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
            borderColor: task.done ? accent : '#3a3a42',
            backgroundColor: task.done ? accent : 'transparent',
          },
        ]}>
        {task.done ? <CheckIcon size={12} color={color.text} weight="bold" /> : null}
      </View>

      <T
        numberOfLines={1}
        style={[
          styles.title,
          {
            color: task.done ? '#5c5c65' : '#e9e9ec',
            textDecorationLine: task.done ? 'line-through' : 'none',
            textDecorationColor: accent,
          },
        ]}>
        {task.title}
      </T>

      {meta ? <T style={styles.meta}>{meta}</T> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ajustes de la tarea"
        hitSlop={hitSlopFor(28)}
        onPress={onOpenSettings}
        style={({ pressed }) => [
          styles.cog,
          pressed && { backgroundColor: '#1d1d21' },
        ]}>
        <SlidersHorizontalIcon size={17} color="#5a5a62" />
      </Pressable>
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
    borderRadius: 12,
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
  meta: { fontSize: 9.5, letterSpacing: 0.8, color: color.labelDim },
  cog: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
