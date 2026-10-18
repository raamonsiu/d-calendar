import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color, radius } from '@/theme/tokens';
import type { CalEvent } from '@/types';
import { CaretRightIcon } from '@/ui/icons';
import { CHIP_HEIGHT } from './allDayBand';

/**
 * Events with no hour, drawn as a chip instead of as a block on the grid.
 *
 * On the grid they would run from midnight to midnight and cover the whole day,
 * hiding everything that does happen at an hour. So they come out of it and sit
 * in a band of their own, which the day view places where it stays in sight:
 * in the heading pinned above the hours.
 *
 * The dot is the same one the cards of the grid carry, which is one of the six
 * places handoff §6 allows the accent. Nothing else here has colour.
 */

/** One all-day event, named, which opens it. */
export function AllDayChip({
  event,
  onPress,
}: {
  event: CalEvent;
  onPress: (event: CalEvent) => void;
}) {
  const { t } = useTranslation();
  const accent = useAccent();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('home.allDayLabel', { title: event.title })}
      onPress={() => onPress(event)}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: pressed ? color.cardPressed : color.cardHover },
      ]}>
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <AppText numberOfLines={1} style={styles.title}>
        {event.title}
      </AppText>
    </Pressable>
  );
}

/**
 * The last chip of a band that did not fit: how many are left, and the way to
 * see them. It is outlined and ends in a caret, unlike the flat chips above
 * it, so it reads as something to tap and not as one more event.
 */
export function AllDayMoreChip({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('home.allDayMore', { count })}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        styles.moreChip,
        { backgroundColor: pressed ? color.cardPressed : color.hairline },
      ]}>
      <AppText numberOfLines={1} style={styles.moreLabel}>
        {t('home.allDayMoreChip', { count })}
      </AppText>
      <CaretRightIcon size={10} color={color.textMuted} />
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
  moreChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: color.edge,
    paddingHorizontal: 9,
  },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  title: { flex: 1, fontSize: 10, color: color.textSoft },
  moreLabel: { fontSize: 9, letterSpacing: 1, color: color.textStrong },
});
