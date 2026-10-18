import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { formatLongDate } from '@/lib/date';
import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { color, radius, size } from '@/theme/tokens';
import type { CalEvent } from '@/types';
import { Dialog } from '@/ui/Dialog';

type AllDayDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Day whose list is shown; kept while the dialog animates out. */
  day: Date | null;
  /** Every all-day event of that day. */
  events: CalEvent[];
  onPressEvent: (event: CalEvent) => void;
};

/**
 * Every all-day event of a day, by title, in a dialog centred on the screen:
 * what the "+N" chip of the day view opens when the heading has no room left
 * to name them all. Tapping one closes the dialog and opens the event.
 */
export function AllDayDialog({
  open,
  onClose,
  day,
  events,
  onPressEvent,
}: AllDayDialogProps) {
  const { t } = useTranslation();
  const { language } = usePrefs();
  const accent = useAccent();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      closeLabel={t('common.close')}
      title={
        day
          ? t('home.allDayDialogTitle', {
              day: formatLongDate(day, language).toUpperCase(),
            })
          : ''
      }>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}>
        {events.map((event) => (
          <Pressable
            key={event.id}
            accessibilityRole="button"
            accessibilityLabel={t('home.allDayLabel', { title: event.title })}
            onPress={() => {
              onClose();
              onPressEvent(event);
            }}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: pressed ? color.cardPressed : color.card },
            ]}>
            <View style={[styles.dot, { backgroundColor: accent }]} />
            <AppText numberOfLines={2} style={styles.title}>
              {event.title}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  list: { gap: 5 },
  row: {
    minHeight: size.touch,
    borderRadius: radius.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  title: { flex: 1, fontSize: 13, color: color.textBody },
});
