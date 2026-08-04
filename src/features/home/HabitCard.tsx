import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { T } from '@/theme/Text';
import { useAccent, useDuration } from '@/theme/prefs';
import { EASE_OUT, alpha, color, duration, hitSlopFor } from '@/theme/tokens';
import { SlidersHorizontalIcon } from '@/ui/icons';
import { habitFreqLabel, habitStreakUnit, type Habit } from '@/types';

type Props = {
  habit: Habit;
  width: number;
  showStreak: boolean;
  onBump: (delta: 1 | -1) => boolean;
  onOpenSettings: () => void;
};

/**
 * Tarjeta de hábito. onPress = +1, onLongPress (420 ms) = −1. Al llegar al
 * objetivo la tarjeta se tiñe del acento, el título se tacha y hay pulso.
 */
export function HabitCard({
  habit,
  width,
  showStreak,
  onBump,
  onOpenSettings,
}: Props) {
  const accent = useAccent();
  const dur = useDuration();
  const done = habit.progress >= habit.target;

  const scale = useSharedValue(1);
  const strike = useSharedValue(done ? 1 : 0);
  const [titleWidth, setTitleWidth] = useState(0);

  useEffect(() => {
    strike.value = withTiming(done ? 1 : 0, {
      duration: dur(duration.strike),
      easing: Easing.bezier(...EASE_OUT),
    });
  }, [done, strike, dur]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const strikeStyle = useAnimatedStyle(() => ({
    width: strike.value * titleWidth,
  }));

  const pulse = () => {
    const ms = dur(duration.pulse);
    if (!ms) return;
    scale.value = withSequence(
      withTiming(0.94, { duration: ms * 0.45 }),
      withTiming(1, { duration: ms * 0.55 }),
    );
  };

  const dotSize = habit.target > 4 ? 5 : 6;

  return (
    <Animated.View style={[{ width }, cardStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${habit.name}, ${habit.progress} de ${habit.target}`}
        accessibilityHint="Toca para sumar una repetición, mantén pulsado para restarla"
        delayLongPress={420}
        onPress={() => {
          if (onBump(1)) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            pulse();
          } else {
            Haptics.selectionAsync();
          }
        }}
        onLongPress={() => {
          Haptics.selectionAsync();
          onBump(-1);
        }}
        style={({ pressed }) => [
          styles.card,
          {
            borderColor: done ? accent : color.borderMut,
            backgroundColor: done
              ? alpha(accent, 0.07)
              : pressed
                ? color.cardHover
                : color.card,
          },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajustes del hábito"
          hitSlop={hitSlopFor(26)}
          onPress={onOpenSettings}
          style={({ pressed }) => [
            styles.cog,
            pressed && { backgroundColor: '#1d1d21' },
          ]}>
          <SlidersHorizontalIcon size={16} color="#5a5a62" />
        </Pressable>

        <View style={styles.dots}>
          {Array.from({ length: habit.target }, (_, k) => (
            <View
              key={k}
              style={{
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                borderWidth: 1,
                borderColor: k < habit.progress ? accent : '#3a3a42',
                backgroundColor: k < habit.progress ? accent : 'transparent',
              }}
            />
          ))}
        </View>

        <View style={styles.foot}>
          <View style={styles.titleWrap}>
            <T
              w={400}
              numberOfLines={2}
              onLayout={(e) => setTitleWidth(e.nativeEvent.layout.width)}
              style={[
                styles.title,
                { color: done ? color.textMuted : '#e9e9ec' },
              ]}>
              {habit.name}
            </T>
            <Animated.View
              pointerEvents="none"
              style={[styles.strike, { backgroundColor: accent }, strikeStyle]}
            />
          </View>

          <View style={styles.metaRow}>
            <T
              numberOfLines={1}
              style={[
                styles.meta,
                { color: habit.target > 1 ? color.textMuted : color.labelDim },
              ]}>
              {habitFreqLabel(habit)}
            </T>
            {showStreak ? (
              <T style={[styles.meta, { color: color.faint }]}>
                · {habit.streak}
                {habitStreakUnit(habit)}
              </T>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    // 84 en el prototipo, a 3 columnas; con 2 columnas la tarjeta es más ancha
    // y necesita algo más de alto para no quedar apaisada.
    height: 92,
    borderRadius: 18,
    borderWidth: 1,
    padding: 9,
    justifyContent: 'space-between',
  },
  cog: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 7 },
  foot: { gap: 3 },
  titleWrap: { alignSelf: 'flex-start' },
  title: { fontSize: 11.5, lineHeight: 14 },
  strike: { position: 'absolute', left: 0, top: '50%', height: 1 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    overflow: 'hidden',
  },
  meta: { fontSize: 8, letterSpacing: 0.6 },
});
