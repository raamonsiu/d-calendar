/**
 * "Calendarios del dispositivo" group of the calendars screen.
 *
 * A single row with three faces, one per state of the system permission: how
 * many calendars are being read when it is granted, an invitation to allow it
 * when it has not been asked yet, and a way into the system settings once it
 * has been denied, which is the only place that can undo it.
 *
 * Without this the denial is a dead end: no calendars appear and nothing says
 * why.
 */
import { useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { isDeviceId } from '@/lib/deviceIds';
import { countLabel } from '@/lib/text';
import {
  ensureCalendarPermission,
  getCalendarPermission,
  type CalendarPermission,
} from '@/services/deviceCalendars';
import { useAppStore } from '@/store/useAppStore';
import { color } from '@/theme/tokens';
import { Group } from '@/ui/Group';
import { GroupRow } from '@/ui/controls';
import { ArrowsClockwiseIcon, CalendarBlankIcon } from '@/ui/icons';

/** Icon size of a settings row, the same one the screens use. */
const ROW_ICON = 15;

/** Height of a row with two lines of text. */
const HINT_ROW_HEIGHT = 62;

export function DeviceCalendarsGroup() {
  const calendars = useAppStore((state) => state.calendars);
  const refresh = useAppStore((state) => state.refresh);
  const ignoredCount = useAppStore((state) => state.ignoredAccounts.length);
  const restoreIgnoredAccounts = useAppStore(
    (state) => state.restoreIgnoredAccounts,
  );

  const [permission, setPermission] =
    useState<CalendarPermission>('undetermined');

  useEffect(() => {
    let subscribed = true;

    const readPermission = () => {
      getCalendarPermission().then((current) => {
        if (subscribed) setPermission(current);
      });
    };

    readPermission();
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') readPermission();
    });

    return () => {
      subscribed = false;
      subscription.remove();
    };
  }, []);

  /**
   * Asks for the permission and, if it is given, sets off a read so the
   * calendars show up without waiting for the next time the app is opened.
   */
  const allow = async () => {
    const granted = await ensureCalendarPermission();
    setPermission(granted ? 'granted' : 'denied');
    if (granted) refresh();
  };

  const deviceCount = calendars.filter((calendar) =>
    isDeviceId(calendar.id),
  ).length;

  if (permission === 'granted') {
    const rowCount = ignoredCount > 0 ? 2 : 1;

    return (
      <Group title="Calendarios del dispositivo">
        <GroupRow
          index={0}
          count={rowCount}
          caret={false}
          icon={<CalendarBlankIcon size={ROW_ICON} color={color.textMuted} />}
          label="Se están leyendo"
          value={countLabel(deviceCount, 'CALENDARIO', 'CALENDARIOS')}
        />

        {ignoredCount > 0 ? (
          <GroupRow
            index={1}
            count={rowCount}
            height={HINT_ROW_HEIGHT}
            icon={
              <ArrowsClockwiseIcon size={ROW_ICON} color={color.textMuted} />
            }
            label={countLabel(ignoredCount, 'CUENTA OCULTA', 'CUENTAS OCULTAS')}
            hint="Toca para volver a leerlas"
            onPress={restoreIgnoredAccounts}
          />
        ) : null}
      </Group>
    );
  }

  const denied = permission === 'denied';

  return (
    <Group title="Calendarios del dispositivo">
      <GroupRow
        index={0}
        count={1}
        height={HINT_ROW_HEIGHT}
        icon={<CalendarBlankIcon size={ROW_ICON} color={color.textMuted} />}
        label={denied ? 'Permiso denegado' : 'Permitir la lectura'}
        hint={
          denied
            ? 'Actívalo en los ajustes del sistema'
            : 'Para ver aquí los eventos de Google, Outlook o iCloud'
        }
        onPress={denied ? () => Linking.openSettings() : allow}
      />
    </Group>
  );
}
