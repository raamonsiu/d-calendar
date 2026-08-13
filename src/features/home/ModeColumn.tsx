import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color, radius } from '@/theme/tokens';
import { ArrowsInSimpleIcon, ArrowsOutSimpleIcon } from '@/ui/icons';

type ModeColumnProps = {
  /**
   * Current view: HOY/SEM in the collapsed box, DÍA/MES in the expanded one.
   */
  label: string;
  /** The other view, the one a tap switches to. */
  other: string;
  expanded: boolean;
  onToggleMode: () => void;
  onToggleExpand: () => void;
};

/**
 * Control column to the left of the calendar box: switching view on top,
 * expanding or collapsing below.
 *
 * The expand button takes whatever height is left while the box is collapsed,
 * and switches to a fixed height once expanded so it does not stretch down the
 * whole screen.
 */
export function ModeColumn({
  label,
  other,
  expanded,
  onToggleMode,
  onToggleExpand,
}: ModeColumnProps) {
  const { t } = useTranslation();
  const accent = useAccent();

  return (
    <View style={styles.column}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('home.modeSwitchLabel', { label, other })}
        onPress={onToggleMode}
        style={({ pressed }) => [
          styles.button,
          styles.modeButton,
          pressed && { borderColor: accent, backgroundColor: color.control },
        ]}>
        <AppText weight={500} style={styles.modeLabel}>
          {label}
        </AppText>
        <View style={[styles.rule, { backgroundColor: accent }]} />
        <AppText style={styles.modeOther}>{other}</AppText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          expanded ? t('home.collapseCalendar') : t('home.expandCalendar')
        }
        onPress={onToggleExpand}
        style={({ pressed }) => [
          styles.button,
          expanded ? styles.expandFixed : styles.expandFlex,
          pressed && { borderColor: accent },
        ]}>
        {expanded ? (
          <ArrowsInSimpleIcon size={15} color={color.textNeutral} />
        ) : (
          <ArrowsOutSimpleIcon size={15} color={color.textNeutral} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { width: 46, gap: 5 },
  button: {
    borderRadius: radius.pill,
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
