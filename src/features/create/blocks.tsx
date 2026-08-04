import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Label, T } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color, radius } from '@/theme/tokens';
import { Bridge } from '@/ui/Bridge';

const OUTER = 26;
const INNER = 13;
const GAP = 5;

export const blockGap = GAP;

/**
 * Caja del formulario. Las cajas de un mismo grupo se unen con el puente
 * del handoff §4b: el primero abre con radio 26, el último cierra con 26.
 */
export function FormBlock({
  first,
  last,
  title,
  right,
  children,
  style,
}: {
  first?: boolean;
  last?: boolean;
  title?: string;
  right?: ReactNode;
  children?: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        styles.block,
        {
          borderTopLeftRadius: first ? OUTER : INNER,
          borderTopRightRadius: first ? OUTER : INNER,
          borderBottomLeftRadius: last ? OUTER : INNER,
          borderBottomRightRadius: last ? OUTER : INNER,
        },
        style,
      ]}>
      {/* El puente se pinta como hijo del segundo elemento del par. */}
      {!first ? (
        <Bridge
          axis="vertical"
          gap={GAP}
          surface={color.surface}
          behind={color.bg}
        />
      ) : null}

      {title || right ? (
        <View style={styles.head}>
          {title ? <Label>{title}</Label> : <View />}
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** Fila etiqueta + control, como INICIO / FIN o DISPONIB. */
export function FieldRow({
  label,
  labelWidth = 44,
  children,
}: {
  label: string;
  labelWidth?: number;
  children: ReactNode;
}) {
  return (
    <View style={styles.fieldRow}>
      <T style={[styles.fieldLabel, { width: labelWidth }]}>{label}</T>
      {children}
    </View>
  );
}

/** Control pulsable con aspecto de input (fecha, hora, valor de aviso). */
export function ControlButton({
  label,
  onPress,
  width,
  grow,
  center,
  muted,
  icon,
  height = 38,
}: {
  label: string;
  onPress: () => void;
  width?: number;
  grow?: boolean;
  center?: boolean;
  muted?: boolean;
  icon?: ReactNode;
  height?: number;
}) {
  const accent = useAccent();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        {
          height,
          width,
          flex: grow ? 1 : undefined,
          justifyContent: center
            ? 'center'
            : icon
              ? 'space-between'
              : 'flex-start',
          borderColor: pressed ? accent : muted ? color.borderMut : color.border,
        },
      ]}>
      <T
        numberOfLines={1}
        style={{ fontSize: 12.5, color: muted ? color.ghost : color.text }}>
        {label}
      </T>
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    position: 'relative',
    backgroundColor: color.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fieldLabel: { fontSize: 9, letterSpacing: 1.2, color: color.labelDim },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.control,
    borderWidth: 1,
    backgroundColor: color.card,
    paddingHorizontal: 12,
  },
});
