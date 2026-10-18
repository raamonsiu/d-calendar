import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/theme/Text';
import { color, hitSlopFor, radius } from '@/theme/tokens';

/** Same height as the compact view selector it sits next to. */
const BUTTON_HEIGHT = 30;

/**
 * The "Hoy" button next to the view selector: the quick way back from a day
 * months away. It carries no accent - it is not a switch, and nothing about it
 * is ever "on".
 */
export function TodayButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('home.goToTodayLabel')}
      hitSlop={hitSlopFor(BUTTON_HEIGHT)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? color.control : color.hairline },
      ]}>
      <AppText style={styles.label}>{t('home.goToToday')}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: BUTTON_HEIGHT,
    paddingHorizontal: 12,
    borderRadius: radius.segment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 8.5, letterSpacing: 1.2, color: color.label },
});
