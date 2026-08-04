import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { alpha, color, radius, tint } from '@/theme/tokens';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Colour dot on the left, on the calendar chips. */
  dotColor?: string;
  /** `grow` splits the width evenly (options and weekdays). */
  grow?: boolean;
  height?: number;
  style?: ViewStyle;
};

/**
 * Selection chip. Once selected it is marked with the border and an accent
 * tint; the colour dot only appears when `dotColor` is passed, and with `grow`
 * the chip stretches to share out the row.
 */
export function Chip({
  label,
  selected,
  onPress,
  dotColor,
  grow,
  height = 31,
  style,
}: ChipProps) {
  const accent = useAccent();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={{ top: 6, bottom: 6 }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          height,
          flex: grow ? 1 : undefined,
          justifyContent: grow ? 'center' : 'flex-start',
          paddingHorizontal: grow ? 4 : 12,
          borderColor: selected ? accent : color.border,
          backgroundColor: selected ? alpha(accent, tint.chip) : color.card,
        },
        style,
      ]}>
      {dotColor ? (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      ) : null}
      <AppText
        numberOfLines={1}
        style={{
          fontSize: 10.5,
          color: selected ? color.text : color.textMuted,
        }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
