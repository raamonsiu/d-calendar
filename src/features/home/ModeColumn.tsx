import { Pressable, StyleSheet, View } from 'react-native';

import { T } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color } from '@/theme/tokens';
import { ArrowsInSimpleIcon, ArrowsOutSimpleIcon } from '@/ui/icons';

type Props = {
  label: string;
  other: string;
  expanded: boolean;
  onToggleMode: () => void;
  onToggleExpand: () => void;
};

/**
 * El control de la izquierda de la caja del calendario: arriba HOY/SEM
 * (o DÍA/MES al expandir), abajo expandir/colapsar.
 */
export function ModeColumn({
  label,
  other,
  expanded,
  onToggleMode,
  onToggleExpand,
}: Props) {
  const accent = useAccent();

  return (
    <View style={styles.column}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Vista ${label}. Cambiar a ${other}`}
        onPress={onToggleMode}
        style={({ pressed }) => [
          styles.button,
          styles.modeButton,
          pressed && { borderColor: accent, backgroundColor: '#1b1b1f' },
        ]}>
        <T w={500} style={styles.modeLabel}>
          {label}
        </T>
        <View style={[styles.rule, { backgroundColor: accent }]} />
        <T style={styles.modeOther}>{other}</T>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Colapsar calendario' : 'Expandir calendario'}
        onPress={onToggleExpand}
        style={({ pressed }) => [
          styles.button,
          expanded ? styles.expandFixed : styles.expandFlex,
          pressed && { borderColor: accent },
        ]}>
        {expanded ? (
          <ArrowsInSimpleIcon size={15} color="#9a9aa2" />
        ) : (
          <ArrowsOutSimpleIcon size={15} color="#9a9aa2" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { width: 46, gap: 5 },
  button: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.borderStrong,
    backgroundColor: color.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButton: { height: 112, gap: 7 },
  modeLabel: { fontSize: 9, letterSpacing: 1.4, color: color.text },
  rule: { width: 16, height: 1 },
  modeOther: { fontSize: 8, letterSpacing: 1.2, color: color.label },
  expandFlex: { flex: 1 },
  expandFixed: { height: 52 },
});
