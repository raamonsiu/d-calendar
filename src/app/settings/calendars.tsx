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
 * Adding an account leads out to the system settings, which is where accounts
 * are actually added; the app has no OAuth of its own.
 *
 * The calendars subscribed by URL are listed with their own group, which is
 * where one gets refreshed on demand or removed: they can be added from two
 * places, so being able to take one away had to live somewhere.
 *
 * Mock: exporting generates no files. Disconnecting does remove the account and
 * its calendars from the store, and local items are kept.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AddSourceSheet,
  type SourceMode,
} from '@/features/calendars/AddSourceSheet';
import { CalendarPickerSheet } from '@/features/calendars/CalendarPickerSheet';
import { DeviceCalendarsGroup } from '@/features/settings/DeviceCalendarsGroup';
import { groupRadius } from '@/lib/groupRadius';
import { countLabel } from '@/lib/text';
import { calendarOptions } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { color, radius } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { CalendarDot } from '@/ui/CalendarDot';
import { Group } from '@/ui/Group';
import { SecondaryScreen } from '@/ui/SecondaryScreen';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { GroupRow, OptionRow } from '@/ui/controls';
import {
  ArrowUpRightIcon,
  CaretDownIcon,
  DotsThreeVerticalIcon,
  GearSixIcon,
  LinkIcon,
  PlusIcon,
  type Icon,
} from '@/ui/icons';

/**
 * The two ways a calendar gets in, and neither is an account form: one leads
 * out to the system settings, where the phone's accounts are added, and the
 * other opens the subscription tab.
 */
const SOURCES: { label: string; mode: SourceMode; Logo: Icon; Mark: Icon }[] = [
  {
    label: 'Añadir una cuenta al teléfono',
    mode: 'account',
    Logo: GearSixIcon,
    Mark: ArrowUpRightIcon,
  },
  {
    label: 'Suscribirse a un calendario por URL',
    mode: 'subscription',
    Logo: LinkIcon,
    Mark: PlusIcon,
  },
];

export default function CalendarsScreen() {
  const accent = useAccent();
  const prefs = usePrefs();
  const toast = useToast();

  const accounts = useAppStore((state) => state.accounts);
  const calendars = useAppStore((state) => state.calendars);
  const disconnectAccount = useAppStore((state) => state.disconnectAccount);
  const removeSubscription = useAppStore((state) => state.removeSubscription);
  const refresh = useAppStore((state) => state.refresh);

  const [defaultSheetOpen, setDefaultSheetOpen] = useState(false);
  const [accountSheetId, setAccountSheetId] = useState<string | null>(null);
  const [subscriptionSheetId, setSubscriptionSheetId] = useState<string | null>(
    null,
  );
  const [sourceMode, setSourceMode] = useState<SourceMode | null>(null);

  /**
   * What can be a destination, in the same list the Crear form draws: the app's
   * own calendars and the ones of the device the system lets it write to, never
   * a subscription or the tasks one.
   */
  const destinations = useMemo(
    () => calendarOptions(calendars, accounts, prefs.defaultCalendarId),
    [accounts, calendars, prefs.defaultCalendarId],
  );

  /**
   * The calendars subscribed from here, which are the ones carrying an address.
   *
   * A subscription the phone itself holds is not one of them: it also shows up
   * in the side menu, but it is removed where it was added, the same as an
   * account.
   */
  const subscriptions = useMemo(
    () => calendars.filter((calendar) => calendar.url),
    [calendars],
  );

  const defaultCalendar = calendars.find(
    (calendar) => calendar.id === prefs.defaultCalendarId,
  );
  const accountInSheet = accounts.find(
    (account) => account.id === accountSheetId,
  );
  const subscriptionInSheet = subscriptions.find(
    (calendar) => calendar.id === subscriptionSheetId,
  );

  const disconnect = () => {
    if (accountInSheet) {
      disconnectAccount(accountInSheet.id);
      toast.show(`${accountInSheet.email} desconectada`);
    }
    setAccountSheetId(null);
  };

  const unsubscribe = () => {
    if (subscriptionInSheet) {
      removeSubscription(subscriptionInSheet.id);
      toast.show(`${subscriptionInSheet.name} eliminado`);
    }
    setSubscriptionSheetId(null);
  };

  return (
    <SecondaryScreen
      title="Calendarios"
      overlays={
        <>
          <CalendarPickerSheet
            open={defaultSheetOpen}
            title="Calendario por defecto"
            options={destinations}
            selectedId={prefs.defaultCalendarId}
            onSelect={(id) => prefs.setPreference('defaultCalendarId', id)}
            onClose={() => setDefaultSheetOpen(false)}
          />

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

          <Sheet
            open={!!subscriptionSheetId}
            onClose={() => setSubscriptionSheetId(null)}
            title={subscriptionInSheet?.name ?? ''}>
            <AppText numberOfLines={2} style={styles.subscriptionUrl}>
              {subscriptionInSheet?.url ?? ''}
            </AppText>
            <View style={styles.options}>
              <OptionRow
                label="Actualizar ahora"
                selected={false}
                onPress={() => {
                  setSubscriptionSheetId(null);
                  refresh();
                }}
              />
              <OptionRow
                label="Eliminar la suscripción"
                selected={false}
                onPress={unsubscribe}
              />
            </View>
          </Sheet>

          <AddSourceSheet
            open={!!sourceMode}
            initialMode={sourceMode ?? undefined}
            onClose={() => setSourceMode(null)}
          />
        </>
      }>
      <Group title="Calendario por defecto">
        <GroupRow
          index={0}
          count={1}
          label={defaultCalendar?.name ?? 'Sin calendario'}
          onPress={() => setDefaultSheetOpen(true)}
          icon={<CalendarDot color={defaultCalendar?.dotColor ?? null} />}
          caret={false}
          right={<CaretDownIcon size={11} color={color.caret} />}
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

      {subscriptions.length ? (
        <Group title="Suscripciones">
          {subscriptions.map((calendar, index) => (
            <Pressable
              key={calendar.id}
              accessibilityRole="button"
              accessibilityLabel={`Opciones de ${calendar.name}`}
              onPress={() => setSubscriptionSheetId(calendar.id)}
              style={({ pressed }) => [
                styles.accountRow,
                groupRadius(index, subscriptions.length),
                { backgroundColor: pressed ? color.cardHover : color.surface },
              ]}>
              <CalendarDot color={calendar.dotColor} />
              <View style={styles.accountBody}>
                <AppText numberOfLines={1} style={styles.accountEmail}>
                  {calendar.name}
                </AppText>
                <AppText numberOfLines={1} style={styles.accountMeta}>
                  {calendar.kind} · SOLO LECTURA
                </AppText>
              </View>
              <DotsThreeVerticalIcon
                size={19}
                color={color.label}
                weight="bold"
              />
            </Pressable>
          ))}
        </Group>
      ) : null}

      <Group title="Añadir" gap={6}>
        {SOURCES.map(({ label, mode, Logo, Mark }) => (
          <Pressable
            key={mode}
            accessibilityRole="button"
            onPress={() => setSourceMode(mode)}
            style={({ pressed }) => [
              styles.connector,
              { borderColor: pressed ? accent : color.borderStrong },
            ]}>
            <Logo size={15} color={color.textMuted} />
            <AppText style={styles.connectorLabel}>{label}</AppText>
            <Mark size={12} color={accent} />
          </Pressable>
        ))}
      </Group>
    </SecondaryScreen>
  );
}

const styles = StyleSheet.create({
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
  subscriptionUrl: {
    fontSize: 10,
    lineHeight: 15,
    color: color.labelDim,
    paddingHorizontal: 6,
  },
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
