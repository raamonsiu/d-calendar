import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useAccent, useDuration } from '@/theme/prefs';
import { EASE_OUT, alpha, color, duration } from '@/theme/tokens';

type Props = {
  value: boolean;
  onChange: (next: boolean) => void;
  /** Envuelve el switch en su propio Pressable; desactívalo si ya hay uno fuera. */
  standalone?: boolean;
};

const TRACK_W = 38;
const TRACK_H = 22;
const KNOB = 16;
const KNOB_OFF = 2;
// El borde de 1px va por dentro en RN: la caja interior mide 36.
const KNOB_ON = TRACK_W - 2 - KNOB - KNOB_OFF; // 18

export function Switch({ value, onChange, standalone = true }: Props) {
  const accent = useAccent();
  const dur = useDuration();
  const t = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    t.value = withTiming(value ? 1 : 0, {
      duration: dur(duration.state),
      easing: Easing.bezier(...EASE_OUT),
    });
  }, [value, t, dur]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: t.value * (KNOB_ON - KNOB_OFF) }],
    backgroundColor: t.value > 0.5 ? accent : '#5c5c65',
  }));

  const track = (
    <View
      style={[
        styles.track,
        {
          backgroundColor: value ? alpha(accent, 0.22) : color.card,
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
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    borderWidth: 1,
  },
  knob: {
    position: 'absolute',
    top: 2,
    left: KNOB_OFF,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
  },
});
