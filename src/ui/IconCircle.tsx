import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAccent } from '@/theme/prefs';
import { alpha, tint } from '@/theme/tokens';

/**
 * Icon centred in a circle with an accent border and a tinted background:
 * the "confirmation" or "illustration" mark used by a sheet's success state
 * and by the onboarding steps.
 *
 * @param icon Icon element, already sized and coloured by the caller.
 * @param size Diameter of the circle; the border stays 1px at any size.
 */
export function IconCircle({ icon, size = 44 }: { icon: ReactNode; size?: number }) {
  const accent = useAccent();

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: accent,
          backgroundColor: alpha(accent, tint.glyph),
        },
      ]}>
      {icon}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
