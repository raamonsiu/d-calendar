/**
 * "Último aviso" group of the settings screen.
 *
 * Draws the two "last chance" summaries - one for the day, one for the week -
 * each with its own switch and, while it is on, the rows that configure when
 * it fires: an hour for the daily one, a day and an hour for the weekly one.
 *
 * Hidden altogether while the master "Recordatorios" switch is off, the same
 * way `NotificationsGroup` hides its own category rows: with every
 * notification off, configuring one that will never fire has nothing to say.
 */
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { clockAsDate, formatTime } from '@/lib/date';
import { usePrefs } from '@/theme/prefs';
import { color } from '@/theme/tokens';
import { Group } from '@/ui/Group';
import { Sheet } from '@/ui/Sheet';
import { Switch } from '@/ui/Switch';
import { GroupRow, OptionRow } from '@/ui/controls';
import { BellIcon, CalendarBlankIcon, ClockIcon } from '@/ui/icons';
import { useDateTimePicker } from '@/ui/pickers';
import type { LastChanceWeeklyDay } from '@/types';

/** Icon size of a settings row, the same one the screen uses. */
const ROW_ICON = 15;

/** Height of a row with two lines of text and a switch. */
const SWITCH_ROW_HEIGHT = 62;

const WEEKLY_DAY_OPTIONS: LastChanceWeeklyDay[] = ['Penúltimo', 'Último'];

type Row =
  | {
      key: string;
      kind: 'switch';
      icon: ReactNode;
      label: string;
      hint: string;
      value: boolean;
      onPress: () => void;
    }
  | {
      key: string;
      kind: 'value';
      icon: ReactNode;
      label: string;
      value: string;
      onPress: () => void;
    };

export function LastChanceGroup() {
  const { t } = useTranslation();
  const prefs = usePrefs();
  const picker = useDateTimePicker();
  const [weeklyDaySheetOpen, setWeeklyDaySheetOpen] = useState(false);

  if (!prefs.notifications) return null;

  const weeklyDayLabel = (day: LastChanceWeeklyDay) =>
    day === 'Último'
      ? t('settings.lastChanceDayLast')
      : t('settings.lastChanceDayBeforeLast');

  /**
   * One entry per row actually drawn, in order: the daily switch, its hour
   * while it is on, the weekly switch, and its day and hour while that one is
   * on. Building the list first is what lets every row ask `groupRadius` for
   * its real position instead of the count being worked out by hand.
   */
  const rows: Row[] = [
    {
      key: 'daily',
      kind: 'switch',
      icon: <BellIcon size={ROW_ICON} color={color.textMuted} />,
      label: t('settings.lastChanceDailyLabel'),
      hint: t('settings.lastChanceDailyHint'),
      value: prefs.lastChanceDaily,
      onPress: () => prefs.setPreference('lastChanceDaily', !prefs.lastChanceDaily),
    },
    ...(prefs.lastChanceDaily
      ? ([
          {
            key: 'dailyTime',
            kind: 'value',
            icon: <ClockIcon size={ROW_ICON} color={color.textMuted} />,
            label: t('settings.lastChanceTimeLabel'),
            value: prefs.lastChanceDailyTime,
            onPress: () =>
              picker.open('time', clockAsDate(prefs.lastChanceDailyTime), (picked) =>
                prefs.setPreference('lastChanceDailyTime', formatTime(picked)),
              ),
          },
        ] as Row[])
      : []),
    {
      key: 'weekly',
      kind: 'switch',
      icon: <BellIcon size={ROW_ICON} color={color.textMuted} />,
      label: t('settings.lastChanceWeeklyLabel'),
      hint: t('settings.lastChanceWeeklyHint'),
      value: prefs.lastChanceWeekly,
      onPress: () => prefs.setPreference('lastChanceWeekly', !prefs.lastChanceWeekly),
    },
    ...(prefs.lastChanceWeekly
      ? ([
          {
            key: 'weeklyDay',
            kind: 'value',
            icon: <CalendarBlankIcon size={ROW_ICON} color={color.textMuted} />,
            label: t('settings.lastChanceDayLabel'),
            value: weeklyDayLabel(prefs.lastChanceWeeklyDay),
            onPress: () => setWeeklyDaySheetOpen(true),
          },
          {
            key: 'weeklyTime',
            kind: 'value',
            icon: <ClockIcon size={ROW_ICON} color={color.textMuted} />,
            label: t('settings.lastChanceTimeLabel'),
            value: prefs.lastChanceWeeklyTime,
            onPress: () =>
              picker.open('time', clockAsDate(prefs.lastChanceWeeklyTime), (picked) =>
                prefs.setPreference('lastChanceWeeklyTime', formatTime(picked)),
              ),
          },
        ] as Row[])
      : []),
  ];

  return (
    <>
      <Group title={t('settings.lastChanceSection')}>
        {rows.map((row, index) => (
          <GroupRow
            key={row.key}
            index={index}
            count={rows.length}
            height={row.kind === 'switch' ? SWITCH_ROW_HEIGHT : undefined}
            caret={row.kind === 'value'}
            icon={row.icon}
            label={row.label}
            hint={row.kind === 'switch' ? row.hint : undefined}
            value={row.kind === 'value' ? row.value : undefined}
            onPress={row.onPress}
            right={
              row.kind === 'switch' ? (
                <Switch standalone={false} value={row.value} onChange={() => {}} />
              ) : undefined
            }
          />
        ))}
      </Group>

      <Sheet
        open={weeklyDaySheetOpen}
        onClose={() => setWeeklyDaySheetOpen(false)}
        title={t('settings.lastChanceDaySheetTitle')}>
        <View style={styles.options}>
          {WEEKLY_DAY_OPTIONS.map((option) => (
            <OptionRow
              key={option}
              label={weeklyDayLabel(option)}
              selected={prefs.lastChanceWeeklyDay === option}
              onPress={() => {
                prefs.setPreference('lastChanceWeeklyDay', option);
                setWeeklyDaySheetOpen(false);
              }}
            />
          ))}
        </View>
      </Sheet>

      {picker.element}
    </>
  );
}

const styles = StyleSheet.create({
  options: { gap: 2 },
});
