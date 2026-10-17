import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color, hitSlopFor, radius, size } from '@/theme/tokens';

/** One option of the selector: the value it stands for and what it reads. */
export type TabOption<Value extends string> = { value: Value; label: string };

type TabsProps<Value extends string> = {
  options: TabOption<Value>[];
  value: Value;
  onChange: (next: Value) => void;
  /** Leaves the selector visible but inert. */
  locked?: boolean;
  /**
   * The small version that sits inside a box: it takes only the width its
   * labels need, lower, and on the box's own raised surface. The regular one
   * stretches across the row it is in.
   */
  compact?: boolean;
  /** Read by a screen reader as the name of the whole selector. */
  accessibilityLabel?: string;
};

/** Height of a tab, regular and compact. */
const TAB_HEIGHT = 30;
const COMPACT_TAB_HEIGHT = 24;

/**
 * The compact tabs stretch their touch area only up and down: sideways it
 * would run into the tab next door.
 */
const COMPACT_SLOP = hitSlopFor(COMPACT_TAB_HEIGHT);
const COMPACT_HIT_SLOP = { top: COMPACT_SLOP.top, bottom: COMPACT_SLOP.bottom };

/**
 * Segmented selector: one tab per option, the chosen one raised and marked
 * with the accent dot, which is the only colour it carries ("active switch",
 * handoff §6).
 *
 * Draws the tabs inert while `locked`, and in the compact size when asked.
 */
export function Tabs<Value extends string>({
  options,
  value,
  onChange,
  locked = false,
  compact = false,
  accessibilityLabel,
}: TabsProps<Value>) {
  const accent = useAccent();

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[styles.tabs, compact ? styles.tabsCompact : styles.tabsRegular]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled: locked }}
            disabled={locked}
            hitSlop={compact ? COMPACT_HIT_SLOP : undefined}
            onPress={() => onChange(option.value)}
            style={[
              styles.tab,
              compact ? styles.tabCompact : styles.tabRegular,
              selected && styles.tabSelected,
            ]}>
            <View
              style={[
                styles.dot,
                { backgroundColor: selected ? accent : 'transparent' },
              ]}
            />
            <AppText
              style={[
                compact ? styles.labelCompact : styles.labelRegular,
                { color: selected ? color.text : color.label },
              ]}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 3, borderRadius: radius.segment },
  tabsRegular: { flex: 1, padding: 4, backgroundColor: color.surface },
  tabsCompact: {
    alignSelf: 'flex-start',
    padding: 3,
    backgroundColor: color.hairline,
  },
  tab: {
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  tabRegular: { flex: 1, height: TAB_HEIGHT },
  tabCompact: {
    height: COMPACT_TAB_HEIGHT,
    minWidth: size.touch,
    paddingHorizontal: 9,
  },
  tabSelected: { backgroundColor: color.control, borderColor: color.edge },
  dot: { width: 4, height: 4, borderRadius: 2 },
  labelRegular: { fontSize: 9.5, letterSpacing: 1.2 },
  labelCompact: { fontSize: 8.5, letterSpacing: 1.2 },
});
