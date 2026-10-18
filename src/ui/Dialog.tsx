import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { Label } from '@/theme/Text';
import { OVERLAY_OPACITY, color, layer, radius } from '@/theme/tokens';
import { XIcon } from './icons';
import { usePanelTransition } from './usePanelTransition';

/** Minimum distance from the screen edges. */
const SCREEN_INSET = 24;

/** How much smaller the card starts, so it grows into place as it fades in. */
const ENTRY_SCALE = 0.94;

type DialogProps = {
  open: boolean;
  onClose: () => void;
  /** Micro label of the header. */
  title: string;
  /** Read by a screen reader on the close controls. */
  closeLabel: string;
  children: ReactNode;
};

/**
 * Floating card centred on the screen, over the same 55% overlay as `Sheet`,
 * for a short list that belongs to something on screen rather than to the
 * bottom edge. Like `Sheet`, it is laid out over its parent instead of in a
 * `Modal`, and it shares its entrance, exit and back button through
 * `usePanelTransition`.
 *
 * It closes by tapping the overlay, with the X in the header, or with the
 * Android back button.
 */
export function Dialog({
  open,
  onClose,
  title,
  closeLabel,
  children,
}: DialogProps) {
  const { mounted, progress } = usePanelTransition(open, onClose);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value * OVERLAY_OPACITY,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: ENTRY_SCALE + (1 - ENTRY_SCALE) * progress.value }],
  }));

  if (!mounted) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.layer]}
      pointerEvents="box-none">
      <Pressable
        accessibilityLabel={closeLabel}
        onPress={onClose}
        style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
        />
      </Pressable>

      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          style={[styles.card, cardStyle]}>
          <View style={styles.header}>
            <Label>{title}</Label>
            <Pressable
              accessibilityLabel={closeLabel}
              hitSlop={9}
              onPress={onClose}
              style={styles.close}>
              <XIcon size={13} color={color.label} />
            </Pressable>
          </View>
          {children}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { zIndex: layer.panel },
  overlay: { backgroundColor: color.scrim },
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_INSET,
  },
  card: {
    maxHeight: '70%',
    backgroundColor: color.surface,
    borderRadius: radius.sheet,
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  close: {
    width: 26,
    height: 26,
    borderRadius: radius.joined,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
