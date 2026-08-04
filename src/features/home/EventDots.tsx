import { StyleSheet, View } from 'react-native';

import { AppText } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color } from '@/theme/tokens';

/** Past this point the dots no longer fit: the rest is summed up as "+N". */
const MAX_DOTS = 3;

/**
 * How many events a day has, drawn the way the collapsed week and the month
 * grid do it: up to three accent dots and, if there are more, a "+N" next to
 * them.
 *
 * With `count` at 0 it draws nothing.
 */
export function EventDots({
  count,
  dotSize,
  fontSize,
}: {
  count: number;
  dotSize: number;
  fontSize: number;
}) {
  const accent = useAccent();
  const dots = Math.min(MAX_DOTS, count);

  return (
    <>
      {Array.from({ length: dots }, (_, index) => (
        <View
          key={index}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: accent,
          }}
        />
      ))}
      {count > MAX_DOTS ? (
        <AppText style={[styles.more, { fontSize }]}>
          +{count - MAX_DOTS}
        </AppText>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  more: { color: color.textMuted },
});
