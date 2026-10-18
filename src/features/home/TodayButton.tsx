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
 *
 * While `disabled` - today already on screen in the day view, where it would
 * take you nowhere - it goes flat and dim; otherwise it is outlined and its
 * label lit, which is what tells the two apart at a glance.
 */
export function TodayButton({
  disabled,
  onPress,
}: {
  disabled: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('home.goToTodayLabel')}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={hitSlopFor(BUTTON_HEIGHT)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.buttonDisabled : styles.buttonEnabled,
        pressed && { backgroundColor: color.control },
      ]}>
      <AppText
        style={[
          styles.label,
          { color: disabled ? color.faint : color.textStrong },
        ]}>
        {t('home.goToToday')}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: BUTTON_HEIGHT,
    paddingHorizontal: 12,
    borderRadius: radius.segment,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonEnabled: { backgroundColor: color.hairline, borderColor: color.edge },
  buttonDisabled: { backgroundColor: 'transparent', borderColor: 'transparent' },
  label: { fontSize: 8.5, letterSpacing: 1.2 },
});
