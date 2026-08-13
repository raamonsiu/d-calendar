import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color, radius } from '@/theme/tokens';
import type { CalEvent } from '@/types';

/**
 * Events with no hour, drawn as a chip instead of as a block on the grid.
 *
 * On the grid they would run from midnight to midnight and cover the whole day,
 * hiding everything that does happen at an hour. So they come out of it and sit
 * in a band of their own, which the two hour views place where it stays in
 * sight: above the rail in the day strip, and in the pinned heading of each
 * column in the expanded grid.
 *
 * The dot is the same one the cards of the grid carry, which is one of the six
 * places handoff §6 allows the accent. Nothing else here has colour.
 */

/** Height of one chip, and the gap between two of them. */
export const CHIP_HEIGHT = 20;
export const CHIP_GAP = 3;

/**
 * How much room `count` chips add above a grid, capped at `maxRows`.
 *
 * The caller needs this before drawing, because what the chips take is taken
 * from the grid underneath and the grid has to be told how much is left. Each
 * row counts its own gap, which is the one separating it from whatever sits
 * above it: the heading for the first, the previous chip for the rest.
 *
 * Postcondition: 0 for a day with nothing, so a day with no all-day events adds
 * no room at all rather than an empty strip.
 *
 * @param count How many all-day events the day holds.
 * @param maxRows Most chips that may be drawn.
 */
export function allDayHeight(count: number, maxRows: number) {
  return Math.min(count, maxRows) * (CHIP_HEIGHT + CHIP_GAP);
}

/**
 * One all-day event. `extra` turns it into the last chip of a band that did not
 * fit, which says how many are left instead of naming one of them.
 */
export function AllDayChip({
  event,
  extra,
  onPress,
}: {
  event: CalEvent;
  extra?: number;
  onPress: (event: CalEvent) => void;
}) {
  const { t } = useTranslation();
  const accent = useAccent();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        extra
          ? t('home.allDayMore', { count: extra })
          : t('home.allDayLabel', { title: event.title })
      }
      onPress={() => onPress(event)}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: pressed ? color.cardPressed : color.cardHover },
      ]}>
      {extra ? null : (
        <View style={[styles.dot, { backgroundColor: accent }]} />
      )}
      <AppText numberOfLines={1} style={styles.title}>
        {extra ? `+${extra}` : event.title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: CHIP_HEIGHT,
    borderRadius: radius.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  title: { flex: 1, fontSize: 10, color: color.textSoft },
});
