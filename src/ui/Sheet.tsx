import { useEffect, type ReactNode } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Label } from '@/theme/Text';
import { useDuration } from '@/theme/prefs';
import {
  OVERLAY_OPACITY,
  color,
  duration,
  layer,
  radius,
} from '@/theme/tokens';
import { XIcon } from './icons';
import { usePanelTransition } from './usePanelTransition';

/** Room between the sheet and the keyboard while it is open. */
const KEYBOARD_GAP = 16;

/** Minimum distance from the screen edges. */
const SCREEN_INSET = 10;

/** Height of the header, which is also the drag area. */
const HEADER_PADDING = 16;

/** Extra travel on the way out so the sheet disappears completely. */
const EXIT_OVERSHOOT = 24;

/** Drag and velocity past which the gesture closes the sheet. */
const CLOSE_DRAG = 90;
const CLOSE_VELOCITY = 800;

/** Gesture threshold: below this the touch is still a tap. */
const DRAG_ACTIVATION = 10;

type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Micro label of the header, which is also the drag area. */
  title?: string;
  children: ReactNode;
};

/**
 * Bottom sheet from the design: a floating card 10px off the edges, radius 28
 * and a black overlay at 55%. It is mounted inside the screen instead of in a
 * `Modal` so it comes out exactly like the prototype.
 *
 * It closes in three ways: tapping the overlay, with the X in the header, or
 * dragging the header down. The gesture lives in the header only because
 * covering the whole card would make it compete with the inner scrolls (the
 * time picker wheels, the changelog list).
 *
 * Without `title` no header is drawn, and then there is no drag gesture either.
 *
 * Opening or closing one dismisses whatever keyboard is up. Opening: a sheet
 * asking to pick a time or a calendar has nothing for it to focus, so a field
 * left focused behind it would just sit there covering half the sheet until
 * the user found an empty spot to tap. Closing: a sheet that does have a field
 * of its own, like the guest one, leaves it focused when it closes on its own
 * action - pressing INVITAR does not blur the field it sits next to - and the
 * keyboard would otherwise stay up with nothing left on screen to type into.
 * Focusing the field while the sheet is open still opens the keyboard the
 * normal way; this only ever closes it.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const resolveDuration = useDuration();
  const insets = useSafeAreaInsets();
  const { mounted, progress } = usePanelTransition(open, onClose);

  useEffect(() => {
    Keyboard.dismiss();
  }, [open]);

  const sheetHeight = useSharedValue(600);
  const dragOffset = useSharedValue(0);
  const keyboardLift = useSharedValue(0);

  /**
   * The app draws edge to edge, so the window does not resize itself when the
   * keyboard opens: the sheet lifts by hand until it is clear of it.
   */
  useEffect(() => {
    const isIos = Platform.OS === 'ios';

    const showSubscription = Keyboard.addListener(
      isIos ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const lift =
          Math.max(0, event.endCoordinates.height - insets.bottom) +
          KEYBOARD_GAP;
        keyboardLift.value = withTiming(lift, {
          duration: resolveDuration(duration.state),
        });
      },
    );

    const hideSubscription = Keyboard.addListener(
      isIos ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        keyboardLift.value = withTiming(0, {
          duration: resolveDuration(duration.press),
        });
      },
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [insets.bottom, keyboardLift, resolveDuration]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value * OVERLAY_OPACITY,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY:
          (1 - progress.value) * (sheetHeight.value + EXIT_OVERSHOOT) +
          dragOffset.value -
          keyboardLift.value,
      },
    ],
  }));

  const dragGesture = Gesture.Pan()
    .activeOffsetY(DRAG_ACTIVATION)
    .failOffsetY(-DRAG_ACTIVATION)
    .onChange((event) => {
      dragOffset.value = Math.max(0, dragOffset.value + event.changeY);
    })
    .onEnd((event) => {
      const shouldClose =
        dragOffset.value > CLOSE_DRAG || event.velocityY > CLOSE_VELOCITY;
      /**
       * It always goes back to 0: on reopening, the sheet starts from its
       * place.
       */
      dragOffset.value = withTiming(0, { duration: duration.press });
      if (shouldClose) runOnJS(onClose)();
    });

  if (!mounted) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.layer]}
      pointerEvents="box-none">
      <Pressable
        accessibilityLabel="Cerrar"
        onPress={onClose}
        style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
        />
      </Pressable>

      <Animated.View
        onLayout={(event) => {
          sheetHeight.value = event.nativeEvent.layout.height;
        }}
        style={[
          styles.sheet,
          { bottom: Math.max(SCREEN_INSET, insets.bottom) },
          sheetStyle,
        ]}>
        {title ? (
          <GestureDetector gesture={dragGesture}>
            <View style={styles.header}>
              <Label>{title}</Label>
              <Pressable
                accessibilityLabel="Cerrar"
                hitSlop={9}
                onPress={onClose}
                style={styles.close}>
                <XIcon size={13} color={color.label} />
              </Pressable>
            </View>
          </GestureDetector>
        ) : null}
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { zIndex: layer.panel },
  overlay: { backgroundColor: color.scrim },
  sheet: {
    position: 'absolute',
    left: SCREEN_INSET,
    right: SCREEN_INSET,
    backgroundColor: color.surface,
    borderRadius: radius.sheet,
    paddingTop: HEADER_PADDING,
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 12,
  },
  header: {
    /**
     * It eats the top padding of the sheet so the drag area covers that room
     * too, not just the height of the text.
     */
    marginTop: -HEADER_PADDING,
    paddingTop: HEADER_PADDING,
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
