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
import { Pressable, StyleSheet, View } from 'react-native';

import { countLabel } from '@/lib/text';
import { useAppStore } from '@/store/useAppStore';
import { AppText } from '@/theme/Text';
import { usePrefs, type WeekStart } from '@/theme/prefs';
import { ACCENTS, color } from '@/theme/tokens';
import { Group } from '@/ui/Group';
import { SecondaryScreen } from '@/ui/SecondaryScreen';
import { Sheet } from '@/ui/Sheet';
import { Switch } from '@/ui/Switch';
import { GroupRow, OptionRow } from '@/ui/controls';
import {
  CalendarBlankIcon,
  CheckIcon,
  DropHalfIcon,
  SquaresFourIcon,
  TextAaIcon,
  TimerIcon,
  WindIcon,
} from '@/ui/icons';

const WEEK_START_OPTIONS: WeekStart[] = ['Lunes', 'Sábado', 'Domingo'];

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

/** Which of the three sheets is open. */
type OpenSheet = 'weekStart' | 'duration' | 'accent' | null;

export default function SettingsScreen() {
  const prefs = usePrefs();
  const accounts = useAppStore((state) => state.accounts);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

  const closeSheet = () => setOpenSheet(null);

  /** Custom durations are not in the list: they are shown in minutes. */
  const durationLabel =
    DURATION_OPTIONS.find((option) => option.minutes === prefs.defaultDuration)
      ?.label ?? `${prefs.defaultDuration} min`;

  return (
    <SecondaryScreen
      title="Ajustes"
      overlays={
        <>
          <Sheet
            open={openSheet === 'weekStart'}
            onClose={closeSheet}
            title="Día de inicio de la semana">
            <View style={styles.options}>
              {WEEK_START_OPTIONS.map((option) => (
                <OptionRow
                  key={option}
                  label={option}
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
            title="Duración por defecto">
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
            title="Color de remarcado">
            <View style={styles.swatches}>
              {ACCENTS.map((option) => {
                const selected = prefs.accent === option.hex;
                return (
                  <Pressable
                    key={option.hex}
                    accessibilityRole="radio"
                    accessibilityLabel={option.name}
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
      <Group title="General">
        <GroupRow
          index={0}
          count={2}
          icon={<CalendarBlankIcon size={ROW_ICON} color={color.textMuted} />}
          label="Día de inicio de la semana"
          value={prefs.weekStart}
          onPress={() => setOpenSheet('weekStart')}
        />
        <GroupRow
          index={1}
          count={2}
          icon={<TimerIcon size={ROW_ICON} color={color.textMuted} />}
          label="Duración por defecto"
          value={durationLabel}
          onPress={() => setOpenSheet('duration')}
        />
      </Group>

      <Group title="Apariencia">
        <GroupRow
          index={0}
          count={1}
          icon={<DropHalfIcon size={ROW_ICON} color={color.textMuted} />}
          label="Color de remarcado"
          onPress={() => setOpenSheet('accent')}
          right={
            <View style={[styles.dot, { backgroundColor: prefs.accent }]} />
          }
        />
      </Group>

      <Group title="Integraciones">
        <GroupRow
          index={0}
          count={1}
          icon={<SquaresFourIcon size={ROW_ICON} color={color.textMuted} />}
          label="Calendarios"
          onPress={() => router.push('/settings/calendars')}
          right={
            <AppText style={styles.meta}>
              {countLabel(accounts.length, 'CUENTA', 'CUENTAS')}
            </AppText>
          }
        />
      </Group>

      <Group title="Accesibilidad">
        <GroupRow
          index={0}
          count={2}
          height={SWITCH_ROW_HEIGHT}
          caret={false}
          icon={<WindIcon size={ROW_ICON} color={color.textMuted} />}
          label="Reducir animaciones"
          hint="Transiciones mínimas en toda la app"
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
          count={2}
          height={SWITCH_ROW_HEIGHT}
          caret={false}
          icon={<TextAaIcon size={ROW_ICON} color={color.textMuted} />}
          label="Fuente monoespaciada"
          hint="Roboto Mono en toda la interfaz"
          onPress={() => prefs.setPreference('mono', !prefs.mono)}
          right={
            <Switch standalone={false} value={prefs.mono} onChange={() => {}} />
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
