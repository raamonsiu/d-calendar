import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/theme/Text';
import { color, size } from '@/theme/tokens';
import { ArrowLeftIcon } from './icons';
import { IconButton } from './controls';

/**
 * Header of the secondary screens: back arrow and title.
 *
 * Without `onBack` the arrow goes back, or to Home when this screen was opened
 * straight from a deep link and there is no history. With `compact` the title
 * drops to 15px, which is what the help articles need because their titles are
 * long.
 */
export function ScreenHeader({
  title,
  onBack,
  compact,
}: {
  title: string;
  onBack?: () => void;
  compact?: boolean;
}) {
  const { t } = useTranslation();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={styles.row}>
      <IconButton
        size={32}
        label={t('common.goBack')}
        style={styles.back}
        onPress={onBack ?? goBack}>
        <ArrowLeftIcon size={20} color={color.textMuted} />
      </IconButton>
      <AppText
        weight={500}
        numberOfLines={2}
        style={[styles.title, compact && styles.titleCompact]}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    /**
     * Minimum height so the row does not depend on text metrics on the first
     * measurement, same as the Home header.
     */
    minHeight: size.header,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 2,
  },
  back: { marginLeft: -5 },
  title: { flex: 1, fontSize: 19, letterSpacing: -0.3 },
  titleCompact: { fontSize: 15, lineHeight: 19 },
});
