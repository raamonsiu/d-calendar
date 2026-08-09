import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText, Label } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color, radius, size } from '@/theme/tokens';
import { Bridge } from '@/ui/Bridge';
import { Switch } from '@/ui/Switch';

/**
 * Pieces of the Crear form and the item detail. The form boxes are a group
 * connected with the "gap Nothing" bridge (handoff §4b): the first one opens
 * with the outer radius and the last one closes with it.
 */

const OUTER_RADIUS = radius.box;
const INNER_RADIUS = radius.control;

/** Gap between boxes of the same group; the container needs it too. */
export const BLOCK_GAP = 5;

/**
 * A form box, with its micro label and a slot on the right for a control (a
 * switch, a counter).
 *
 * `first` and `last` mark the ends of the group: only those two corners get the
 * outer radius. Every box but the first draws the bridge that covers the gap
 * with the previous one.
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
          borderTopLeftRadius: first ? OUTER_RADIUS : INNER_RADIUS,
          borderTopRightRadius: first ? OUTER_RADIUS : INNER_RADIUS,
          borderBottomLeftRadius: last ? OUTER_RADIUS : INNER_RADIUS,
          borderBottomRightRadius: last ? OUTER_RADIUS : INNER_RADIUS,
        },
        style,
      ]}>
      {!first ? (
        <Bridge
          axis="vertical"
          gap={BLOCK_GAP}
          surface={color.surface}
          behind={color.background}
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

/**
 * Switch in a box header, with its label to the left: "TODO EL DÍA" on an
 * event, "SIN FECHA EXACTA" on a task. The label lights up while the switch is
 * on.
 */
export function BlockSwitch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <AppText
        style={[
          styles.switchLabel,
          { color: value ? color.text : color.labelDim },
        ]}>
        {label}
      </AppText>
      <Switch value={value} onChange={onChange} />
    </View>
  );
}

/** Row of chips that wraps when they no longer fit. */
export function ChipWrap({ children }: { children: ReactNode }) {
  return <View style={styles.chipWrap}>{children}</View>;
}

/** Row of label plus control, like INICIO / FIN or DISPONIB. */
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
      <AppText style={[styles.fieldLabel, { width: labelWidth }]}>
        {label}
      </AppText>
      {children}
    </View>
  );
}

/**
 * Pressable control that looks like a field: date, time, reminder value.
 *
 * `muted` dims it without disabling it, which is what is needed when the value
 * does not apply (an all-day event, a task with no time) but tapping it still
 * has to bring it back.
 *
 * `leading` goes before the label and `icon` after it; with either of them the
 * label takes the room in between, so the two ends stay put whatever the text.
 */
export function ControlButton({
  label,
  onPress,
  width,
  grow,
  center,
  muted,
  leading,
  icon,
  height = size.control,
}: {
  label: string;
  onPress: () => void;
  width?: number;
  grow?: boolean;
  center?: boolean;
  muted?: boolean;
  leading?: ReactNode;
  icon?: ReactNode;
  height?: number;
}) {
  const accent = useAccent();

  const justifyContent = center
    ? 'center'
    : icon
      ? 'space-between'
      : 'flex-start';

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
          justifyContent,
          borderColor: pressed
            ? accent
            : muted
              ? color.borderBox
              : color.border,
        },
      ]}>
      {leading}
      <AppText
        numberOfLines={1}
        style={{
          flex: icon && !center ? 1 : undefined,
          fontSize: 12.5,
          color: muted ? color.ghost : color.text,
        }}>
        {label}
      </AppText>
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
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 9, letterSpacing: 1.2 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
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
