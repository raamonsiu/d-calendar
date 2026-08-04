import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { T } from '@/theme/Text';
import { color } from '@/theme/tokens';
import { ArrowLeftIcon } from './icons';
import { IconButton } from './controls';

/** Cabecera de las pantallas secundarias: flecha atrás + título 19/500. */
export function ScreenHeader({
  title,
  onBack,
  compact,
}: {
  title: string;
  onBack?: () => void;
  /** Los artículos de ayuda usan 15px porque el título es largo. */
  compact?: boolean;
}) {
  return (
    <View style={styles.row}>
      <IconButton
        size={32}
        label="Atrás"
        style={styles.back}
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}>
        <ArrowLeftIcon size={20} color={color.textMuted} />
      </IconButton>
      <T
        w={500}
        numberOfLines={2}
        style={[styles.title, compact && { fontSize: 15, lineHeight: 19 }]}>
        {title}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    // Alto mínimo para que la fila no dependa de las métricas del texto en la
    // primera medición, igual que la cabecera de la Home.
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 2,
  },
  back: { marginLeft: -5 },
  title: { flex: 1, fontSize: 19, letterSpacing: -0.3 },
});
