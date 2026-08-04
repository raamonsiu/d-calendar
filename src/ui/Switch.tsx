import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useAccent, useDuration } from '@/theme/prefs';
import { EASE_OUT, alpha, color, duration, tint } from '@/theme/tokens';

type SwitchProps = {
  value: boolean;
  onChange: (next: boolean) => void;
  /**
   * Wraps the switch in its own Pressable; turn it off when there is one
   * outside.
   */
  standalone?: boolean;
};

const TRACK_WIDTH = 38;
const TRACK_HEIGHT = 22;
const KNOB_SIZE = 16;
const KNOB_INSET = 2;

/**
 * Travel of the knob. The 1px border goes inside in React Native, so the inner
 * box is 36 wide and not 38.
 */
const KNOB_TRAVEL = TRACK_WIDTH - 2 - KNOB_SIZE - KNOB_INSET * 2;

/**
 * Point of the animation from which the knob is already drawn in the accent.
 */
const KNOB_TINT_AT = 0.5;

/**
 * Switch from the design. The knob moves with `translateX` (not with `left`) so
 * the animation runs on the UI thread, and the track is tinted with the accent
 * while it is on.
 */
export function Switch({ value, onChange, standalone = true }: SwitchProps) {
  const accent = useAccent();
  const resolveDuration = useDuration();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      duration: resolveDuration(duration.state),
      easing: Easing.bezier(...EASE_OUT),
    });
  }, [value, progress, resolveDuration]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * KNOB_TRAVEL }],
    backgroundColor: progress.value > KNOB_TINT_AT ? accent : color.knobOff,
  }));

  const track = (
    <View
      style={[
        styles.track,
        {
          backgroundColor: value ? alpha(accent, tint.track) : color.card,
          borderColor: value ? accent : color.borderStrong,
        },
      ]}>
      <Animated.View style={[styles.knob, knobStyle]} />
    </View>
  );

  if (!standalone) return track;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={11}
      onPress={() => onChange(!value)}>
      {track}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    borderWidth: 1,
  },
  knob: {
    position: 'absolute',
    top: KNOB_INSET,
    left: KNOB_INSET,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
  },
});
