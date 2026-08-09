/**
 * "Notificaciones" group of the settings screen.
 *
 * Draws the master switch and, only when the system permission has been denied,
 * a second row leading to the system settings, which is the one place where
 * that decision can be undone.
 *
 * The permission is read on mount and again whenever the app comes back to the
 * foreground: that is how the row disappears after the user grants it outside
 * the app.
 */
import { useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import {
  ensureNotificationPermission,
  getNotificationPermission,
  type NotificationPermission,
} from '@/services/notifications';
import { usePrefs } from '@/theme/prefs';
import { color } from '@/theme/tokens';
import { Group } from '@/ui/Group';
import { Switch } from '@/ui/Switch';
import { GroupRow } from '@/ui/controls';
import { BellIcon, GearSixIcon } from '@/ui/icons';

/** Icon size of a settings row, the same one the screen uses. */
const ROW_ICON = 15;

/** Height of a row with two lines of text and a switch. */
const SWITCH_ROW_HEIGHT = 62;

export function NotificationsGroup() {
  const prefs = usePrefs();
  const [permission, setPermission] =
    useState<NotificationPermission>('undetermined');

  useEffect(() => {
    let subscribed = true;

    const readPermission = () => {
      getNotificationPermission().then((current) => {
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
   * Switching reminders on is the natural moment to ask for the permission: the
   * user has just said they want them.
   */
  const toggleNotifications = async () => {
    const next = !prefs.notifications;
    prefs.setPreference('notifications', next);
    if (!next) return;

    const granted = await ensureNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
  };

  const showDeniedRow = prefs.notifications && permission === 'denied';
  const rowCount = showDeniedRow ? 2 : 1;

  return (
    <Group title="Notificaciones">
      <GroupRow
        index={0}
        count={rowCount}
        height={SWITCH_ROW_HEIGHT}
        caret={false}
        icon={<BellIcon size={ROW_ICON} color={color.textMuted} />}
        label="Recordatorios"
        hint="Avisos de eventos, tareas y hábitos"
        onPress={toggleNotifications}
        right={
          <Switch
            standalone={false}
            value={prefs.notifications}
            onChange={() => {}}
          />
        }
      />

      {showDeniedRow ? (
        <GroupRow
          index={1}
          count={rowCount}
          icon={<GearSixIcon size={ROW_ICON} color={color.textMuted} />}
          label="Permiso denegado"
          hint="Actívalo en los ajustes del sistema"
          onPress={() => Linking.openSettings()}
        />
      ) : null}
    </Group>
  );
}
