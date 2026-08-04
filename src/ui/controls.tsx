import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { groupRadius } from '@/lib/groupRadius';
import { T } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { alpha, color, hitSlopFor, radius } from '@/theme/tokens';
import { CaretRightIcon, CheckIcon } from './icons';

/** Botón cuadrado de icono. Siempre con 44px de área táctil. */
export function IconButton({
  onPress,
  children,
  size = 28,
  label,
  style,
}: {
  onPress: () => void;
  children: ReactNode;
  size?: number;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={hitSlopFor(size)}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? color.hairline : 'transparent',
        },
        style,
      ]}>
      {children}
    </Pressable>
  );
}

/** La barra de 54px de abajo. `primary` la pinta con el acento. */
export function Cta({
  label,
  onPress,
  primary,
  icon,
  disabled,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  const accent = useAccent();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cta,
        primary
          ? {
              borderColor: accent,
              backgroundColor: alpha(accent, pressed ? 0.14 : 0.07),
            }
          : {
              borderColor: pressed ? accent : color.borderStrong,
              backgroundColor: pressed ? '#131315' : '#0e0e10',
            },
        disabled && { opacity: 0.45 },
      ]}>
      {icon}
      <T
        style={{
          fontSize: 10,
          letterSpacing: 2,
          color: primary ? color.text : '#c9c9d0',
        }}>
        {label}
      </T>
    </Pressable>
  );
}

/** Botón de borde discontinuo: «añadir invitado», «añadir cuenta»… */
export function DashedButton({
  label,
  icon,
  onPress,
  height = 38,
}: {
  label: string;
  icon?: ReactNode;
  onPress: () => void;
  height?: number;
}) {
  const accent = useAccent();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.dashed,
        { height, borderColor: pressed ? accent : color.borderStrong },
      ]}>
      {icon}
      <T
        style={{
          fontSize: 10,
          letterSpacing: 1.4,
          color: color.textMuted,
        }}>
        {label}
      </T>
    </Pressable>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

/**
 * Fila de una lista de Ajustes/Ayuda/Acerca: superficie propia, radios del
 * «gap Nothing» separado y el pressed como cambio de superficie.
 */
export function GroupRow({
  index,
  count,
  onPress,
  icon,
  label,
  hint,
  value,
  right,
  caret = true,
  height = 56,
}: {
  index: number;
  count: number;
  onPress?: () => void;
  icon?: ReactNode;
  label: string;
  hint?: string;
  value?: string;
  right?: ReactNode;
  caret?: boolean;
  height?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.groupRow,
        groupRadius(index, count),
        { height, backgroundColor: pressed ? color.cardHover : color.surface },
      ]}>
      {icon}
      <View style={styles.groupRowBody}>
        <T style={{ fontSize: 12.5, color: color.textBody }}>{label}</T>
        {hint ? (
          <T style={{ fontSize: 9, letterSpacing: 0.4, color: color.labelDim }}>
            {hint}
          </T>
        ) : null}
      </View>
      {value ? (
        <T style={{ fontSize: 11.5, color: color.textMuted }}>{value}</T>
      ) : null}
      {right}
      {caret ? <CaretRightIcon size={11} color="#3f3f47" /> : null}
    </Pressable>
  );
}

/** Fila de opción dentro de un bottom sheet. */
export function OptionRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const accent = useAccent();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionRow,
        {
          backgroundColor: selected
            ? color.cardHover
            : pressed
              ? color.hairline
              : 'transparent',
        },
      ]}>
      <T
        style={{
          flex: 1,
          fontSize: 13,
          color: selected ? color.text : '#b9b9c1',
        }}>
        {label}
      </T>
      {selected ? <CheckIcon size={13} color={accent} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cta: {
    height: 54,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  dashed: {
    borderRadius: radius.control,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  divider: { height: 1, backgroundColor: color.line },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  groupRowBody: { flex: 1, gap: 2 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 17,
  },
});
