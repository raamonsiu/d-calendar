/**
 * Accounts and calendars (route `/settings/calendars`).
 *
 * How you get here: from Settings › Integraciones › Calendarios.
 *
 * Where it leads: nowhere. The default calendar, the account options and adding
 * a new source are all resolved in bottom sheets.
 *
 * The calendars of the device are the real part of this screen: their group
 * reports the system permission and is the way back in when it has been denied.
 *
 * Mock: connecting an account opens no browser and asks for no permissions, and
 * exporting generates no files. Disconnecting does remove the account and its
 * calendars from the store, and local items are kept.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AddSourceSheet } from '@/features/calendars/AddSourceSheet';
import { DeviceCalendarsGroup } from '@/features/settings/DeviceCalendarsGroup';
import { groupRadius } from '@/lib/groupRadius';
import { countLabel } from '@/lib/text';
import { useAppStore } from '@/store/useAppStore';
import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { color, radius } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Group } from '@/ui/Group';
import { SecondaryScreen } from '@/ui/SecondaryScreen';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { GroupRow, OptionRow } from '@/ui/controls';
import {
  AppleLogoIcon,
  DotsThreeVerticalIcon,
  GoogleLogoIcon,
  MicrosoftOutlookLogoIcon,
  PlusIcon,
  type Icon,
} from '@/ui/icons';
import type { Provider } from '@/types';

/** Providers that can be connected, each with its logo. */
const CONNECTORS: { label: string; provider: Provider; Logo: Icon }[] = [
  {
    label: 'Conectar cuenta de Google',
    provider: 'GOOGLE',
    Logo: GoogleLogoIcon,
  },
  { label: 'Conectar iCloud', provider: 'ICLOUD', Logo: AppleLogoIcon },
  {
    label: 'Conectar Outlook',
    provider: 'OUTLOOK',
    Logo: MicrosoftOutlookLogoIcon,
  },
];

export default function CalendarsScreen() {
  const accent = useAccent();
  const prefs = usePrefs();
  const toast = useToast();

  const accounts = useAppStore((state) => state.accounts);
  const calendars = useAppStore((state) => state.calendars);
  const disconnectAccount = useAppStore((state) => state.disconnectAccount);

  const [defaultSheetOpen, setDefaultSheetOpen] = useState(false);
  const [accountSheetId, setAccountSheetId] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<Provider | null>(
    null,
  );

  /** Only own calendars that are not the tasks one can be written to. */
  const writableCalendars = useMemo(
    () =>
      calendars.filter(
        (calendar) => !calendar.readOnly && calendar.kind !== 'TAREAS',
      ),
    [calendars],
  );

  const defaultCalendar = calendars.find(
    (calendar) => calendar.id === prefs.defaultCalendarId,
  );
  const accountInSheet = accounts.find(
    (account) => account.id === accountSheetId,
  );

  const disconnect = () => {
    if (accountInSheet) {
      disconnectAccount(accountInSheet.id);
      toast.show(`${accountInSheet.email} desconectada`);
    }
    setAccountSheetId(null);
  };

  return (
    <SecondaryScreen
      title="Calendarios"
      overlays={
        <>
          <Sheet
            open={defaultSheetOpen}
            onClose={() => setDefaultSheetOpen(false)}
            title="Calendario por defecto">
            <View style={styles.options}>
              {writableCalendars.map((calendar) => (
                <OptionRow
                  key={calendar.id}
                  label={calendar.name}
                  selected={prefs.defaultCalendarId === calendar.id}
                  onPress={() => {
                    prefs.setPreference('defaultCalendarId', calendar.id);
                    setDefaultSheetOpen(false);
                  }}
                />
              ))}
            </View>
          </Sheet>

          <Sheet
            open={!!accountSheetId}
            onClose={() => setAccountSheetId(null)}
            title={accountInSheet?.email ?? ''}>
            <View style={styles.options}>
              <OptionRow
                label="Exportar como .ics"
                selected={false}
                onPress={() => {
                  setAccountSheetId(null);
                  toast.show(
                    'La exportación llegará con la sincronización real',
                  );
                }}
              />
              <OptionRow
                label="Desconectar la cuenta"
                selected={false}
                onPress={disconnect}
              />
            </View>
          </Sheet>

          <AddSourceSheet
            open={!!connectingProvider}
            initialProvider={connectingProvider ?? undefined}
            onClose={() => setConnectingProvider(null)}
          />
        </>
      }>
      <Group title="Calendario por defecto">
        <GroupRow
          index={0}
          count={1}
          label={defaultCalendar?.name ?? 'Sin calendario'}
          value="CAMBIAR"
          onPress={() => setDefaultSheetOpen(true)}
          icon={
            <View
              style={[
                styles.dot,
                { backgroundColor: defaultCalendar?.dotColor ?? accent },
              ]}
            />
          }
        />
      </Group>

      <DeviceCalendarsGroup />

      <Group title="Cuentas conectadas">
        {accounts.map((account, index) => {
          const owned = calendars.filter(
            (calendar) => calendar.accountId === account.id,
          ).length;

          return (
            <Pressable
              key={account.id}
              accessibilityRole="button"
              accessibilityLabel={`Opciones de ${account.email}`}
              onPress={() => setAccountSheetId(account.id)}
              style={({ pressed }) => [
                styles.accountRow,
                groupRadius(index, accounts.length),
                {
                  backgroundColor: pressed ? color.cardHover : color.surface,
                },
              ]}>
              <Avatar initial={account.initial} />
              <View style={styles.accountBody}>
                <AppText numberOfLines={1} style={styles.accountEmail}>
                  {account.email}
                </AppText>
                <AppText style={styles.accountMeta}>
                  {account.provider} ·{' '}
                  {countLabel(owned, 'CALENDARIO', 'CALENDARIOS')}
                </AppText>
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
        {CONNECTORS.map(({ label, provider, Logo }) => (
          <Pressable
            key={provider}
            accessibilityRole="button"
            onPress={() => setConnectingProvider(provider)}
            style={({ pressed }) => [
              styles.connector,
              { borderColor: pressed ? accent : color.borderStrong },
            ]}>
            <Logo size={15} color={color.textMuted} />
            <AppText style={styles.connectorLabel}>{label}</AppText>
            <PlusIcon size={12} color={accent} />
          </Pressable>
        ))}
      </Group>
    </SecondaryScreen>
  );
}

const styles = StyleSheet.create({
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
