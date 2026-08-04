import { StyleSheet, View } from 'react-native';

import { AppText } from '@/theme/Text';
import { color } from '@/theme/tokens';

/** Ratio between the letter and the diameter of the circle. */
const INITIAL_RATIO = 0.4;

/**
 * Circle with an initial: accounts in the side menu and in Settings, and event
 * guests. The letter size is derived from the diameter, so the same piece works
 * in all three places.
 */
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
      <AppText style={{ fontSize: size * INITIAL_RATIO, color: color.textNote }}>
        {initial}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 1,
    borderColor: color.edge,
    backgroundColor: color.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
