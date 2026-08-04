import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore } from '@/store/useAppStore';
import { T } from '@/theme/Text';
import { usePrefs, type WeekStart } from '@/theme/prefs';
import { ACCENTS, color, space } from '@/theme/tokens';
import { Group } from '@/ui/Group';
import { ScreenHeader } from '@/ui/ScreenHeader';
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

const WEEK_OPTIONS: WeekStart[] = ['Lunes', 'Sábado', 'Domingo'];

const DURATIONS: { label: string; minutes: number }[] = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 h', minutes: 60 },
  { label: '1 h 30', minutes: 90 },
];

type Modal = 'week' | 'duration' | 'color' | null;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const prefs = usePrefs();
  const accounts = useAppStore((s) => s.accounts);
  const [modal, setModal] = useState<Modal>(null);

  const durationLabel =
    DURATIONS.find((d) => d.minutes === prefs.defaultDuration)?.label ??
    `${prefs.defaultDuration} min`;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 14 },
        ]}>
        <ScreenHeader title="Ajustes" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>
          <Group title="General">
            <GroupRow
              index={0}
              count={2}
              icon={<CalendarBlankIcon size={15} color={color.textMuted} />}
              label="Día de inicio de la semana"
              value={prefs.weekStart}
              onPress={() => setModal('week')}
            />
            <GroupRow
              index={1}
              count={2}
              icon={<TimerIcon size={15} color={color.textMuted} />}
              label="Duración por defecto"
              value={durationLabel}
              onPress={() => setModal('duration')}
            />
          </Group>

          <Group title="Apariencia">
            <GroupRow
              index={0}
              count={1}
              icon={<DropHalfIcon size={15} color={color.textMuted} />}
              label="Color de remarcado"
              onPress={() => setModal('color')}
              right={
                <View
                  style={[styles.swatch, { backgroundColor: prefs.accent }]}
                />
              }
            />
          </Group>

          <Group title="Integraciones">
            <GroupRow
              index={0}
              count={1}
              icon={<SquaresFourIcon size={15} color={color.textMuted} />}
              label="Calendarios"
              onPress={() => router.push('/settings/calendars')}
              right={
                <T style={styles.meta}>
                  {accounts.length}{' '}
                  {accounts.length === 1 ? 'CUENTA' : 'CUENTAS'}
                </T>
              }
            />
          </Group>

          <Group title="Accesibilidad">
            <GroupRow
              index={0}
              count={2}
              height={62}
              caret={false}
              icon={<WindIcon size={15} color={color.textMuted} />}
              label="Reducir animaciones"
              hint="Transiciones mínimas en toda la app"
              onPress={() => prefs.set('reduceMotion', !prefs.reduceMotion)}
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
              height={62}
              caret={false}
              icon={<TextAaIcon size={15} color={color.textMuted} />}
              label="Fuente monoespaciada"
              hint="Roboto Mono en toda la interfaz"
              onPress={() => prefs.set('mono', !prefs.mono)}
              right={
                <Switch standalone={false} value={prefs.mono} onChange={() => {}} />
              }
            />
          </Group>
        </ScrollView>
      </View>

      <Sheet
        open={modal === 'week'}
        onClose={() => setModal(null)}
        title="Día de inicio de la semana">
        <View style={styles.options}>
          {WEEK_OPTIONS.map((o) => (
            <OptionRow
              key={o}
              label={o}
              selected={prefs.weekStart === o}
              onPress={() => {
                prefs.set('weekStart', o);
                setModal(null);
              }}
            />
          ))}
        </View>
      </Sheet>

      <Sheet
        open={modal === 'duration'}
        onClose={() => setModal(null)}
        title="Duración por defecto">
        <View style={styles.options}>
          {DURATIONS.map((d) => (
            <OptionRow
              key={d.label}
              label={d.label}
              selected={prefs.defaultDuration === d.minutes}
              onPress={() => {
                prefs.set('defaultDuration', d.minutes);
                setModal(null);
              }}
            />
          ))}
        </View>
      </Sheet>

      <Sheet
        open={modal === 'color'}
        onClose={() => setModal(null)}
        title="Color de remarcado">
        <View style={styles.colors}>
          {ACCENTS.map((c) => {
            const on = prefs.accent === c.hex;
            return (
              <Pressable
                key={c.hex}
                accessibilityRole="radio"
                accessibilityLabel={c.name}
                accessibilityState={{ selected: on }}
                onPress={() => {
                  prefs.set('accent', c.hex);
                  setModal(null);
                }}
                style={[
                  styles.color,
                  {
                    backgroundColor: c.hex,
                    borderColor: on ? color.text : 'transparent',
                  },
                ]}>
                {on ? <CheckIcon size={16} color={color.bg} weight="bold" /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  screen: { flex: 1, paddingHorizontal: space.screen, gap: 12 },
  scroll: { gap: 16, paddingBottom: 6 },
  swatch: { width: 18, height: 18, borderRadius: 9 },
  meta: { fontSize: 9, letterSpacing: 1.1, color: color.faint },
  options: { gap: 2, maxHeight: 320 },
  colors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 8,
  },
  color: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
