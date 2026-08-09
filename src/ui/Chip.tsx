import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { AppText } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { alpha, color, radius, tint } from '@/theme/tokens';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** `grow` splits the width evenly (options and weekdays). */
  grow?: boolean;
  height?: number;
  style?: ViewStyle;
};

/**
 * Selection chip. Once selected it is marked with the border and an accent
 * tint, and with `grow` it stretches to share out the row.
 */
export function Chip({
  label,
  selected,
  onPress,
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
});
