import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { T } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { alpha, color, radius } from '@/theme/tokens';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Punto de color a la izquierda (chips de calendario). */
  dot?: string;
  /** `grow` reparte el ancho a partes iguales (opciones y días de la semana). */
  grow?: boolean;
  height?: number;
  style?: ViewStyle;
};

export function Chip({
  label,
  selected,
  onPress,
  dot,
  grow,
  height = 31,
  style,
}: Props) {
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
          backgroundColor: selected ? alpha(accent, 0.09) : color.card,
        },
        style,
      ]}>
      {dot ? (
        <View style={[styles.dot, { backgroundColor: dot }]} />
      ) : null}
      <T
        numberOfLines={1}
        style={{ fontSize: 10.5, color: selected ? color.text : color.textMuted }}>
        {label}
      </T>
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
