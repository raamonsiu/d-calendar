import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { color, hitSlopFor, radius } from '@/theme/tokens';
import { SlidersHorizontalIcon } from '@/ui/icons';

/** Ratio between the icon and the side of the button. */
const ICON_RATIO = 0.62;

/**
 * Button that opens the detail of a task or a habit from Home.
 *
 * It sits inside another pressable (the row or the card), so it fills its touch
 * area with `hitSlop` instead of growing, to avoid eating the main gesture.
 */
export function ItemSettingsButton({
  label,
  onPress,
  size,
  style,
}: {
  label: string;
  onPress: () => void;
  size: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={hitSlopFor(size)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size },
        pressed && styles.pressed,
        style,
      ]}>
      <SlidersHorizontalIcon
        size={Math.round(size * ICON_RATIO)}
        color={color.icon}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.tap,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: color.controlPressed },
});
