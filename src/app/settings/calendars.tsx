import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddSourceSheet } from '@/features/calendars/AddSourceSheet';
import { useAppStore } from '@/store/useAppStore';
import { T } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { color, radius, space } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Group } from '@/ui/Group';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { GroupRow, OptionRow } from '@/ui/controls';
import {
  AppleLogoIcon,
  DotsThreeVerticalIcon,
  GoogleLogoIcon,
  MicrosoftOutlookLogoIcon,
  PlusIcon,
} from '@/ui/icons';
import { groupRadius } from '@/lib/groupRadius';
import type { Provider } from '@/types';

const CONNECTORS = [
  { label: 'Conectar cuenta de Google', provider: 'GOOGLE' as Provider, Icon: GoogleLogoIcon },
  { label: 'Conectar iCloud', provider: 'ICLOUD' as Provider, Icon: AppleLogoIcon },
  { label: 'Conectar Outlook', provider: 'OUTLOOK' as Provider, Icon: MicrosoftOutlookLogoIcon },
];

export default function CalendarsScreen() {
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const prefs = usePrefs();
  const toast = useToast();

  const accounts = useAppStore((s) => s.accounts);
  const calendars = useAppStore((s) => s.calendars);
  const disconnectAccount = useAppStore((s) => s.disconnectAccount);

  const [defaultSheet, setDefaultSheet] = useState(false);
  const [accountSheet, setAccountSheet] = useState<string | null>(null);
  const [connect, setConnect] = useState<Provider | null>(null);

  const writable = useMemo(
    () => calendars.filter((c) => !c.readOnly && c.kind !== 'TAREAS'),
    [calendars],
  );
  const defaultCal = calendars.find((c) => c.id === prefs.defaultCalendarId);
  const account = accounts.find((a) => a.id === accountSheet);

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 14 },
        ]}>
        <ScreenHeader title="Calendarios" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>
          <Group title="Calendario por defecto">
            <GroupRow
              index={0}
              count={1}
              label={defaultCal?.name ?? 'Sin calendario'}
              value="CAMBIAR"
              onPress={() => setDefaultSheet(true)}
              icon={
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: defaultCal?.dot ?? accent },
                  ]}
                />
              }
            />
          </Group>

          <Group title="Cuentas conectadas">
            {accounts.map((a, i) => {
              const n = calendars.filter((c) => c.accountId === a.id).length;
              return (
                <Pressable
                  key={a.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Opciones de ${a.email}`}
                  onPress={() => setAccountSheet(a.id)}
                  style={({ pressed }) => [
                    styles.accountRow,
                    groupRadius(i, accounts.length),
                    {
                      backgroundColor: pressed
                        ? color.cardHover
                        : color.surface,
                    },
                  ]}>
                  <Avatar initial={a.initial} />
                  <View style={styles.accountBody}>
                    <T numberOfLines={1} style={styles.accountEmail}>
                      {a.email}
                    </T>
                    <T style={styles.accountMeta}>
                      {a.provider} · {n}{' '}
                      {n === 1 ? 'CALENDARIO' : 'CALENDARIOS'}
                    </T>
                  </View>
                  <DotsThreeVerticalIcon
                    size={19}
                    color={color.label}
                    weight="bold"
                  />
                </Pressable>
              );
            })}
          </Group>

          <Group title="Conectar" gap={6}>
            {CONNECTORS.map(({ label, provider, Icon }) => (
              <Pressable
                key={provider}
                accessibilityRole="button"
                onPress={() => setConnect(provider)}
                style={({ pressed }) => [
                  styles.connector,
                  { borderColor: pressed ? accent : color.borderStrong },
                ]}>
                <Icon size={15} color={color.textMuted} />
                <T style={styles.connectorLabel}>{label}</T>
                <PlusIcon size={12} color={accent} />
              </Pressable>
            ))}
          </Group>
        </ScrollView>
      </View>

      <Sheet
        open={defaultSheet}
        onClose={() => setDefaultSheet(false)}
        title="Calendario por defecto">
        <View style={styles.options}>
          {writable.map((c) => (
            <OptionRow
              key={c.id}
              label={c.name}
              selected={prefs.defaultCalendarId === c.id}
              onPress={() => {
                prefs.set('defaultCalendarId', c.id);
                setDefaultSheet(false);
              }}
            />
          ))}
        </View>
      </Sheet>

      <Sheet
        open={!!accountSheet}
        onClose={() => setAccountSheet(null)}
        title={account?.email ?? ''}>
        <View style={styles.options}>
          <OptionRow
            label="Exportar como .ics"
            selected={false}
            onPress={() => {
              setAccountSheet(null);
              toast.show('La exportación llegará con la sincronización real');
            }}
          />
          <OptionRow
            label="Desconectar la cuenta"
            selected={false}
            onPress={() => {
              if (account) {
                disconnectAccount(account.id);
                toast.show(`${account.email} desconectada`);
              }
              setAccountSheet(null);
            }}
          />
        </View>
      </Sheet>

      <AddSourceSheet
        open={!!connect}
        initialProvider={connect ?? undefined}
        onClose={() => setConnect(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  screen: { flex: 1, paddingHorizontal: space.screen, gap: 12 },
  scroll: { gap: 16, paddingBottom: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    height: 62,
    paddingHorizontal: 16,
  },
  accountBody: { flex: 1, gap: 2 },
  accountEmail: { fontSize: 12, color: color.textBody },
  accountMeta: { fontSize: 9, letterSpacing: 1.1, color: color.labelDim },
  connector: {
    height: 48,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 16,
  },
  connectorLabel: { flex: 1, fontSize: 11.5, color: color.textSoft },
  options: { gap: 2 },
});
