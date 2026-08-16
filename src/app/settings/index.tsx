/**
 * Settings (route `/settings`).
 *
 * How you get here: from the Home side menu.
 *
 * Where it leads: to `/settings/calendars`. Every other option is resolved
 * right here in a bottom sheet, without changing screen.
 *
 * Everything on this screen is an in-memory preference (`usePrefs`): closing
 * the app restores the defaults.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { weekStartLabel } from '@/data/translations/domain';
import { NotificationsGroup } from '@/features/settings/NotificationsGroup';
import { countLabel } from '@/lib/text';
import { useAppStore } from '@/store/useAppStore';
import { AppText } from '@/theme/Text';
import { usePrefs, type Language, type WeekStart } from '@/theme/prefs';
import { ACCENTS, color } from '@/theme/tokens';
import { Group } from '@/ui/Group';
import { SecondaryScreen } from '@/ui/SecondaryScreen';
import { Sheet } from '@/ui/Sheet';
import { Switch } from '@/ui/Switch';
import { GroupRow, OptionRow } from '@/ui/controls';
import {
  CalendarBlankIcon,
  CheckIcon,
  CircleHalfIcon,
  DropHalfIcon,
  SquaresFourIcon,
  TextAaIcon,
  TimerIcon,
  TranslateIcon,
  WindIcon,
} from '@/ui/icons';

const WEEK_START_OPTIONS: WeekStart[] = ['Lunes', 'Sábado', 'Domingo'];

/**
 * Language choices, each shown by its name in its own language: a Spanish
 * speaker needs to recognise "English" and "Català" regardless of which
 * language the rest of the interface is currently in, so these never go
 * through `t()`.
 */
const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'es', label: 'Castellano' },
  { value: 'en', label: 'English' },
  { value: 'ca', label: 'Català' },
];

/** Durations offered for a new event. */
const DURATION_OPTIONS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 h', minutes: 60 },
  { label: '1 h 30', minutes: 90 },
];

/** Icon size of a settings row. */
const ROW_ICON = 15;

/** Height of the rows carrying a switch, which have two lines of text. */
const SWITCH_ROW_HEIGHT = 62;

/** Which of the four sheets is open. */
type OpenSheet = 'language' | 'weekStart' | 'duration' | 'accent' | null;

export default function SettingsScreen() {
  const { t } = useTranslation();
  const prefs = usePrefs();
  const accounts = useAppStore((state) => state.accounts);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

  const closeSheet = () => setOpenSheet(null);

  /** Custom durations are not in the list: they are shown in minutes. */
  const durationLabel =
    DURATION_OPTIONS.find((option) => option.minutes === prefs.defaultDuration)
      ?.label ?? `${prefs.defaultDuration} min`;

  const languageLabel =
    LANGUAGE_OPTIONS.find((option) => option.value === prefs.language)
      ?.label ?? prefs.language;

  return (
    <SecondaryScreen
      title={t('settings.title')}
      overlays={
        <>
          <Sheet
            open={openSheet === 'language'}
            onClose={closeSheet}
            title={t('settings.languageLabel')}>
            <View style={styles.options}>
              {LANGUAGE_OPTIONS.map((option) => (
                <OptionRow
                  key={option.value}
                  label={option.label}
                  selected={prefs.language === option.value}
                  onPress={() => {
                    prefs.setPreference('language', option.value);
                    closeSheet();
                  }}
                />
              ))}
            </View>
          </Sheet>

          <Sheet
            open={openSheet === 'weekStart'}
            onClose={closeSheet}
            title={t('settings.weekStartLabel')}>
            <View style={styles.options}>
              {WEEK_START_OPTIONS.map((option) => (
                <OptionRow
                  key={option}
                  label={weekStartLabel(option, prefs.language)}
                  selected={prefs.weekStart === option}
                  onPress={() => {
                    prefs.setPreference('weekStart', option);
                    closeSheet();
                  }}
                />
              ))}
            </View>
          </Sheet>

          <Sheet
            open={openSheet === 'duration'}
            onClose={closeSheet}
            title={t('settings.defaultDurationLabel')}>
            <View style={styles.options}>
              {DURATION_OPTIONS.map((option) => (
                <OptionRow
                  key={option.label}
                  label={option.label}
                  selected={prefs.defaultDuration === option.minutes}
                  onPress={() => {
                    prefs.setPreference('defaultDuration', option.minutes);
                    closeSheet();
                  }}
                />
              ))}
            </View>
          </Sheet>

          <Sheet
            open={openSheet === 'accent'}
            onClose={closeSheet}
            title={t('settings.accentLabel')}>
            <View style={styles.swatches}>
              {ACCENTS.map((option) => {
                const selected = prefs.accent === option.hex;
                return (
                  <Pressable
                    key={option.hex}
                    accessibilityRole="radio"
                    accessibilityLabel={t(option.labelKey)}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      prefs.setPreference('accent', option.hex);
                      closeSheet();
                    }}
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: option.hex,
                        borderColor: selected ? color.text : 'transparent',
                      },
                    ]}>
                    {selected ? (
                      <CheckIcon
                        size={16}
                        color={color.background}
                        weight="bold"
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </Sheet>
        </>
      }>
      <Group title={t('settings.generalSection')}>
        <GroupRow
          index={0}
          count={3}
          icon={<TranslateIcon size={ROW_ICON} color={color.textMuted} />}
          label={t('settings.languageLabel')}
          value={languageLabel}
          onPress={() => setOpenSheet('language')}
        />
        <GroupRow
          index={1}
          count={3}
          icon={<CalendarBlankIcon size={ROW_ICON} color={color.textMuted} />}
          label={t('settings.weekStartLabel')}
          value={weekStartLabel(prefs.weekStart, prefs.language)}
          onPress={() => setOpenSheet('weekStart')}
        />
        <GroupRow
          index={2}
          count={3}
          icon={<TimerIcon size={ROW_ICON} color={color.textMuted} />}
          label={t('settings.defaultDurationLabel')}
          value={durationLabel}
          onPress={() => setOpenSheet('duration')}
        />
      </Group>

      <Group title={t('settings.appearanceSection')}>
        <GroupRow
          index={0}
          count={1}
          icon={<DropHalfIcon size={ROW_ICON} color={color.textMuted} />}
          label={t('settings.accentLabel')}
          onPress={() => setOpenSheet('accent')}
          right={
            <View style={[styles.dot, { backgroundColor: prefs.accent }]} />
          }
        />
      </Group>

      <NotificationsGroup />

      <Group title={t('settings.integrationsSection')}>
        <GroupRow
          index={0}
          count={1}
          icon={<SquaresFourIcon size={ROW_ICON} color={color.textMuted} />}
          label={t('settings.calendarsLabel')}
          onPress={() => router.push('/settings/calendars')}
          right={
            <AppText style={styles.meta}>
              {countLabel(
                accounts.length,
                t('settings.accountSingular'),
                t('settings.accountPlural'),
              )}
            </AppText>
          }
        />
      </Group>

      <Group title={t('settings.accessibilitySection')}>
        <GroupRow
          index={0}
          count={3}
          height={SWITCH_ROW_HEIGHT}
          caret={false}
          icon={<WindIcon size={ROW_ICON} color={color.textMuted} />}
          label={t('settings.reduceMotionLabel')}
          hint={t('settings.reduceMotionHint')}
          onPress={() =>
            prefs.setPreference('reduceMotion', !prefs.reduceMotion)
          }
          right={
            <Switch
              standalone={false}
              value={prefs.reduceMotion}
              onChange={() => {}}
            />
          }
        />
        <GroupRow
          index={1}
          count={3}
          height={SWITCH_ROW_HEIGHT}
          caret={false}
          icon={<TextAaIcon size={ROW_ICON} color={color.textMuted} />}
          label={t('settings.monoLabel')}
          hint={t('settings.monoHint')}
          onPress={() => prefs.setPreference('mono', !prefs.mono)}
          right={
            <Switch standalone={false} value={prefs.mono} onChange={() => {}} />
          }
        />
        <GroupRow
          index={2}
          count={3}
          height={SWITCH_ROW_HEIGHT}
          caret={false}
          icon={<CircleHalfIcon size={ROW_ICON} color={color.textMuted} />}
          label={t('settings.highContrastLabel')}
          hint={t('settings.highContrastHint')}
          onPress={() =>
            prefs.setPreference('highContrast', !prefs.highContrast)
          }
          right={
            <Switch
              standalone={false}
              value={prefs.highContrast}
              onChange={() => {}}
            />
          }
        />
      </Group>
    </SecondaryScreen>
  );
}

const styles = StyleSheet.create({
  dot: { width: 18, height: 18, borderRadius: 9 },
  meta: { fontSize: 9, letterSpacing: 1.1, color: color.faint },
  options: { gap: 2, maxHeight: 320 },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 8,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
