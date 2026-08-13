import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking } from 'react-native';

import {
  ensureCalendarPermission,
  getCalendarPermission,
} from '@/services/deviceCalendars';
import {
  ensureNotificationPermission,
  getNotificationPermission,
} from '@/services/notifications';
import { color } from '@/theme/tokens';
import { Group } from '@/ui/Group';
import { GroupRow } from '@/ui/controls';
import { BellIcon, CalendarBlankIcon } from '@/ui/icons';

/** Permission state shared by the calendar and notification rows. */
type PermissionStatus = 'granted' | 'denied' | 'undetermined';

/**
 * One permission row: reads the current status on mount and again whenever
 * the app comes back to the foreground, the same way `NotificationsGroup`
 * does in Settings. Tapping asks the native permission the first time; once
 * it has been decided, granted or denied, the system only ever shows its own
 * prompt once, so tapping again opens the system settings instead, which is
 * the only place left to change it.
 *
 * @param index Position inside the two-row group, for `groupRadius`.
 * @param label Name of the permission, e.g. "Calendario".
 * @param hint What the app does with it once granted.
 * @param icon Icon drawn to the left of the row.
 * @param getStatus Reads the current status without prompting.
 * @param ensure Prompts for the permission if it has not been asked yet.
 */
function PermissionRow({
  index,
  label,
  hint,
  icon,
  getStatus,
  ensure,
}: {
  index: number;
  label: string;
  hint: string;
  icon: ReactNode;
  getStatus: () => Promise<PermissionStatus>;
  ensure: () => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<PermissionStatus>('undetermined');

  useEffect(() => {
    let subscribed = true;

    const readStatus = () => {
      getStatus().then((current) => {
        if (subscribed) setStatus(current);
      });
    };

    readStatus();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') readStatus();
    });

    return () => {
      subscribed = false;
      subscription.remove();
    };
  }, [getStatus]);

  const onPress = async () => {
    if (status !== 'undetermined') {
      Linking.openSettings();
      return;
    }
    const granted = await ensure();
    setStatus(granted ? 'granted' : 'denied');
  };

  const value =
    status === 'granted'
      ? t('onboarding.statusGranted')
      : status === 'denied'
        ? t('onboarding.statusDenied')
        : t('onboarding.statusPending');

  return (
    <GroupRow
      index={index}
      count={2}
      height={62}
      icon={icon}
      label={label}
      hint={hint}
      value={value}
      onPress={onPress}
    />
  );
}

/**
 * Second onboarding step: asks for the calendar and notification permissions,
 * one row each, reusing the exact functions Settings already asks them with.
 * Never blocks moving on - asking is the point, not gatekeeping.
 */
export function PermissionsStep() {
  const { t } = useTranslation();

  return (
    <Group title={t('onboarding.permissionsTitle')}>
      <PermissionRow
        index={0}
        label={t('onboarding.calendarPermissionLabel')}
        hint={t('onboarding.calendarPermissionHint')}
        icon={<CalendarBlankIcon size={15} color={color.textMuted} />}
        getStatus={getCalendarPermission}
        ensure={ensureCalendarPermission}
      />
      <PermissionRow
        index={1}
        label={t('onboarding.notificationsPermissionLabel')}
        hint={t('onboarding.notificationsPermissionHint')}
        icon={<BellIcon size={15} color={color.textMuted} />}
        getStatus={getNotificationPermission}
        ensure={ensureNotificationPermission}
      />
    </Group>
  );
}
