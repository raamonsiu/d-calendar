/**
 * "Notificaciones" group of the settings screen.
 *
 * Draws the master switch, one switch per kind of item that can remind, and,
 * only when the system permission has been denied, a row leading to the
 * system settings, which is the one place where that decision can be undone.
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
import {
  BellIcon,
  CalendarBlankIcon,
  FireIcon,
  GearSixIcon,
  ListChecksIcon,
} from '@/ui/icons';

/** Icon size of a settings row, the same one the screen uses. */
const ROW_ICON = 15;

/** Height of a row with two lines of text and a switch. */
const SWITCH_ROW_HEIGHT = 62;

/** A preference the category rows below toggle: all four are booleans. */
type CategoryKey =
  | 'notifyEvents'
  | 'notifyTasks'
  | 'notifyHabits'
  | 'notifyForeignEvents';

/** One row per kind of item that can remind, under the master switch. */
const CATEGORY_ROWS: {
  key: CategoryKey;
  label: string;
  hint: string;
  Icon: typeof BellIcon;
}[] = [
  {
    key: 'notifyEvents',
    label: 'Eventos',
    hint: 'De tus calendarios propios',
    Icon: CalendarBlankIcon,
  },
  {
    key: 'notifyTasks',
    label: 'Tareas',
    hint: 'Al llegar la fecha límite',
    Icon: ListChecksIcon,
  },
  {
    key: 'notifyHabits',
    label: 'Hábitos',
    hint: 'A las horas que marques',
    Icon: FireIcon,
  },
  {
    key: 'notifyForeignEvents',
    label: 'Eventos de otros calendarios',
    hint: 'Los del teléfono y los suscritos por URL',
    Icon: CalendarBlankIcon,
  },
];

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

  /**
   * One entry per row the group actually draws, in order: the master switch
   * first, then one per kind of item while it is on, with "Avisos de los
   * calendarios" nested right under the foreign-events row it only matters
   * for, and the denied-permission row last when it applies. Building the list
   * first is what lets every row ask `groupRadius` for its real position
   * instead of the count being worked out by hand alongside the JSX.
   */
  const rows = [
    {
      key: 'notifications',
      label: 'Recordatorios',
      hint: 'Avisos de eventos, tareas y hábitos',
      Icon: BellIcon,
      value: prefs.notifications,
      onPress: toggleNotifications,
    },
    ...(prefs.notifications
      ? CATEGORY_ROWS.flatMap((row) => [
          {
            key: row.key,
            label: row.label,
            hint: row.hint,
            Icon: row.Icon,
            value: prefs[row.key],
            onPress: () => prefs.setPreference(row.key, !prefs[row.key]),
          },
          ...(row.key === 'notifyForeignEvents' && prefs.notifyForeignEvents
            ? [
                {
                  key: 'deviceReminders',
                  label: 'Avisos de los calendarios',
                  hint: 'Usar también los que ya traen sus eventos',
                  Icon: CalendarBlankIcon,
                  value: prefs.deviceReminders,
                  onPress: () =>
                    prefs.setPreference(
                      'deviceReminders',
                      !prefs.deviceReminders,
                    ),
                },
              ]
            : []),
        ])
      : []),
  ];

  return (
    <Group title="Notificaciones">
      {rows.map(({ key, label, hint, Icon, value, onPress }, index) => (
        <GroupRow
          key={key}
          index={index}
          count={rows.length + (showDeniedRow ? 1 : 0)}
          height={SWITCH_ROW_HEIGHT}
          caret={false}
          icon={<Icon size={ROW_ICON} color={color.textMuted} />}
          label={label}
          hint={hint}
          onPress={onPress}
          right={
            <Switch standalone={false} value={value} onChange={() => {}} />
          }
        />
      ))}

      {showDeniedRow ? (
        <GroupRow
          index={rows.length}
          count={rows.length + 1}
          icon={<GearSixIcon size={ROW_ICON} color={color.textMuted} />}
          label="Permiso denegado"
          hint="Actívalo en los ajustes del sistema"
          onPress={() => Linking.openSettings()}
        />
      ) : null}
    </Group>
  );
}
