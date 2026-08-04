import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { groupRadius } from '@/lib/groupRadius';
import { AppText } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { alpha, color, hitSlopFor, radius, size, tint } from '@/theme/tokens';
import { CaretRightIcon, CheckIcon } from './icons';

/**
 * Pressable controls shared by every screen. None of them decides colours on
 * its own: the accent comes in through `useAccent()` and everything else from
 * the tokens.
 */

/**
 * Square icon button. The icon goes in as a child, and `hitSlop` always
 * completes the 44px touch area even when the button is drawn smaller.
 */
export function IconButton({
  onPress,
  children,
  size: buttonSize = 28,
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
      hitSlop={hitSlopFor(buttonSize)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: buttonSize,
          height: buttonSize,
          backgroundColor: pressed ? color.hairline : 'transparent',
        },
        style,
      ]}>
      {children}
    </Pressable>
  );
}

/**
 * The bottom action bar. `primary` draws it with the accent border and tint;
 * without `primary` it is a neutral control. Disabled, it lowers its opacity
 * and stops responding.
 */
export function Cta({
  label,
  onPress,
  primary,
  icon,
  disabled,
  height = size.cta,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
  height?: number;
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
        { height },
        primary
          ? {
              borderColor: accent,
              backgroundColor: alpha(
                accent,
                pressed ? tint.fillPressed : tint.fill,
              ),
            }
          : {
              borderColor: pressed ? accent : color.borderStrong,
              backgroundColor: pressed ? color.sunkenHover : color.sunken,
            },
        disabled && styles.disabled,
      ]}>
      {icon}
      <AppText
        style={{
          fontSize: 10,
          letterSpacing: 2,
          color: primary ? color.text : color.textStrong,
        }}>
        {label}
      </AppText>
    </Pressable>
  );
}

/**
 * Dashed border button for adding things: "añadir invitado", "añadir cuenta",
 * "añadir aviso".
 */
export function DashedButton({
  label,
  icon,
  onPress,
  height = size.control,
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
      <AppText
        style={{ fontSize: 10, letterSpacing: 1.4, color: color.textMuted }}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** 1px separator. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

/**
 * A row of a Settings, Help or About list.
 *
 * The radii come from `groupRadius` based on the position in the group, and the
 * pressed state is a surface change (handoff §6 does not allow shadows).
 * Without `onPress` the row is inert, and `caret` is turned off when the row
 * carries its own control on the right, such as a switch.
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
        <AppText style={styles.groupRowLabel}>{label}</AppText>
        {hint ? <AppText style={styles.groupRowHint}>{hint}</AppText> : null}
      </View>
      {value ? (
        <AppText style={styles.groupRowValue}>{value}</AppText>
      ) : null}
      {right}
      {caret ? <CaretRightIcon size={11} color={color.caret} /> : null}
    </Pressable>
  );
}

/**
 * Single choice row inside a bottom sheet; the chosen one carries the check.
 */
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
      <AppText
        style={{
          flex: 1,
          fontSize: 13,
          color: selected ? color.text : color.textNote,
        }}>
        {label}
      </AppText>
      {selected ? <CheckIcon size={13} color={accent} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    borderRadius: radius.tap,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    borderRadius: radius.cta,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  disabled: { opacity: 0.45 },
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
  groupRowLabel: { fontSize: 12.5, color: color.textBody },
  groupRowHint: { fontSize: 9, letterSpacing: 0.4, color: color.labelDim },
  groupRowValue: { fontSize: 11.5, color: color.textMuted },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 17,
  },
});
