import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { APP_BUILD, APP_VERSION } from '@/data/releases';
import { AppText } from '@/theme/Text';
import { color, radius } from '@/theme/tokens';

/**
 * First onboarding step: the app icon, its name and tagline, and a version
 * and build badge - the same numbers About shows, so a screenshot of either
 * always agrees with the other.
 */
export function WelcomeStep() {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <Image
        source={require('@/assets/images/icon.png')}
        style={styles.logo}
        contentFit="cover"
      />
      <AppText weight={500} style={styles.title}>
        {t('onboarding.welcomeTitle')}
      </AppText>
      <AppText style={styles.tagline}>{t('onboarding.welcomeTagline')}</AppText>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <AppText mono style={styles.badgeText}>
            {t('onboarding.versionBadge', { version: APP_VERSION })}
          </AppText>
        </View>
        <View style={styles.badge}>
          <AppText mono style={styles.badgeText}>
            {t('onboarding.buildBadge', { build: APP_BUILD })}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 14, paddingTop: 40 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radius.logo,
    backgroundColor: color.sunken,
    borderWidth: 1,
    borderColor: color.border,
  },
  title: { fontSize: 21, letterSpacing: -0.4, textAlign: 'center' },
  tagline: {
    fontSize: 12.5,
    lineHeight: 18,
    color: color.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  badge: {
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.card,
    borderRadius: radius.chip,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: { fontSize: 9.5, letterSpacing: 1.2, color: color.textMuted },
});
