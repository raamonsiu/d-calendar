import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  habitFrequencyLabel,
  habitStreakUnit,
  isHabitDone,
} from '@/lib/habits';
import { AppText } from '@/theme/Text';
import { useAccent, useDuration, usePrefs } from '@/theme/prefs';
import { EASE_OUT, alpha, color, duration, radius, tint } from '@/theme/tokens';
import type { Habit } from '@/types';
import { ItemSettingsButton } from './ItemSettingsButton';

/**
 * Card height. The prototype uses 84 across three columns; with two columns the
 * card is wider and needs a bit more height so it does not look squashed.
 */
const CARD_HEIGHT = 92;

/** Side of the button that opens the habit detail. */
const SETTINGS_SIZE = 26;

/** From this target on, the markers shrink so they all fit. */
const DENSE_TARGET = 4;
const DOT_SIZE = 6;
const DENSE_DOT_SIZE = 5;

/** How much the card shrinks on the pulse, and how the duration is split. */
const PULSE_SCALE = 0.94;
const PULSE_IN_RATIO = 0.45;

/** Long press threshold, used to subtract a repetition. */
const LONG_PRESS_MS = 420;

type HabitCardProps = {
  habit: Habit;
  width: number;
  showStreak: boolean;
  /** Returns true when this tap completes the habit. */
  onBump: (delta: 1 | -1) => boolean;
  onOpenSettings: () => void;
};

/**
 * Habit card on Home: the repetition markers on top and the name with its
 * frequency below.
 *
 * A tap adds a repetition and a long press subtracts one. On reaching the
 * target the card is tinted with the accent, the name is struck through with a
 * line animated over its real width, and there is a pulse plus haptic feedback.
 * The streak is only shown when the caller asks for it.
 */
export function HabitCard({
  habit,
  width,
  showStreak,
  onBump,
  onOpenSettings,
}: HabitCardProps) {
  const { t } = useTranslation();
  const accent = useAccent();
  const resolveDuration = useDuration();
  const { language } = usePrefs();
  const done = isHabitDone(habit);

  const scale = useSharedValue(1);
  const strikeProgress = useSharedValue(done ? 1 : 0);
  const [titleWidth, setTitleWidth] = useState(0);

  useEffect(() => {
    strikeProgress.value = withTiming(done ? 1 : 0, {
      duration: resolveDuration(duration.strike),
      easing: Easing.bezier(...EASE_OUT),
    });
  }, [done, strikeProgress, resolveDuration]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const strikeStyle = useAnimatedStyle(() => ({
    width: strikeProgress.value * titleWidth,
  }));

  /** The pulse is skipped entirely under the "Reducir animaciones" setting. */
  const pulse = () => {
    const total = resolveDuration(duration.pulse);
    if (!total) return;
    scale.value = withSequence(
      withTiming(PULSE_SCALE, { duration: total * PULSE_IN_RATIO }),
      withTiming(1, { duration: total * (1 - PULSE_IN_RATIO) }),
    );
  };

  const bumpUp = () => {
    if (onBump(1)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      pulse();
      return;
    }
    Haptics.selectionAsync();
  };

  const bumpDown = () => {
    Haptics.selectionAsync();
    onBump(-1);
  };

  const dotSize = habit.target > DENSE_TARGET ? DENSE_DOT_SIZE : DOT_SIZE;

  return (
    <Animated.View style={[{ width }, cardStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('home.habitProgressLabel', {
          name: habit.name,
          progress: habit.progress,
          target: habit.target,
        })}
        accessibilityHint={t('home.habitHint')}
        delayLongPress={LONG_PRESS_MS}
        onPress={bumpUp}
        onLongPress={bumpDown}
        style={({ pressed }) => [
          styles.card,
          {
            borderColor: done ? accent : color.borderBox,
            backgroundColor: done
              ? alpha(accent, tint.fill)
              : pressed
                ? color.cardHover
                : color.card,
          },
        ]}>
        <ItemSettingsButton
          label={t('home.habitSettingsLabel')}
          size={SETTINGS_SIZE}
          style={styles.settings}
          onPress={onOpenSettings}
        />

        <View style={styles.dots}>
          {Array.from({ length: habit.target }, (_, index) => (
            <View
              key={index}
              style={{
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                borderWidth: 1,
                borderColor: index < habit.progress ? accent : color.outline,
                backgroundColor:
                  index < habit.progress ? accent : 'transparent',
              }}
            />
          ))}
        </View>

        <View style={styles.foot}>
          <View style={styles.titleWrap}>
            <AppText
              weight={400}
              numberOfLines={2}
              onLayout={(event) => setTitleWidth(event.nativeEvent.layout.width)}
              style={[
                styles.title,
                { color: done ? color.textMuted : color.textBody },
              ]}>
              {habit.name}
            </AppText>
            <Animated.View
              pointerEvents="none"
              style={[styles.strike, { backgroundColor: accent }, strikeStyle]}
            />
          </View>

          <View style={styles.metaRow}>
            <AppText
              numberOfLines={1}
              style={[
                styles.meta,
                {
                  color:
                    habit.target > 1 ? color.textMuted : color.labelDim,
                },
              ]}>
              {habitFrequencyLabel(habit, language)}
            </AppText>
            {showStreak ? (
              <AppText style={[styles.meta, { color: color.faint }]}>
                · {habit.streak}
                {habitStreakUnit(habit)}
              </AppText>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 9,
    justifyContent: 'space-between',
  },
  settings: {
    position: 'absolute',
    top: 5,
    right: 5,
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
