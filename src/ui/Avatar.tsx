import { StyleSheet, View } from 'react-native';

import { T } from '@/theme/Text';
import { color } from '@/theme/tokens';

/** Círculo con la inicial: cuentas del drawer y de Ajustes, invitados. */
export function Avatar({
  initial,
  size = 26,
}: {
  initial: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}>
      <T style={{ fontSize: size * 0.4, color: '#b9b9c1' }}>{initial}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 1,
    borderColor: '#2f2f36',
    backgroundColor: color.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
