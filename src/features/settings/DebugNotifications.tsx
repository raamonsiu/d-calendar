/**
 * TEMPORARY debug group of the settings screen.
 *
 * One row posts a notification right away, another one schedules it a few
 * seconds ahead, which is the window to close the app and check that it arrives
 * anyway, and the third reports how many reminders the plan currently has in
 * the system.
 *
 * Delete this file together with `src/services/debugNotifications.ts` and the
 * block using it in `src/app/settings/index.tsx` once reminders have been
 * verified on a device.
 */
import { countLabel } from '@/lib/text';
import {
  countScheduledNotifications,
  scheduleDebugNotificationIn,
  sendDebugNotificationNow,
} from '@/services/debugNotifications';
import { color } from '@/theme/tokens';
import { Group } from '@/ui/Group';
import { useToast } from '@/ui/Toast';
import { GroupRow } from '@/ui/controls';
import { BellIcon, ClockIcon, ListChecksIcon } from '@/ui/icons';

/** Icon size of a settings row, the same one the screen uses. */
const ROW_ICON = 15;

/** Delay of the deferred test, long enough to close the app in time. */
const DEBUG_DELAY_SECONDS = 30;

const ROW_COUNT = 3;

/** Shown when an action needed the permission and did not have it. */
const NO_PERMISSION_MESSAGE = 'Sin permiso de notificaciones';

export function DebugNotifications() {
  const { show } = useToast();

  const sendNow = async () => {
    const sent = await sendDebugNotificationNow();
    show(sent ? 'Notificación enviada' : NO_PERMISSION_MESSAGE);
  };

  const sendDelayed = async () => {
    const scheduled = await scheduleDebugNotificationIn(DEBUG_DELAY_SECONDS);
    show(
      scheduled
        ? `Llegará en ${DEBUG_DELAY_SECONDS} s: cierra la app`
        : NO_PERMISSION_MESSAGE,
    );
  };

  const countScheduled = async () => {
    const count = await countScheduledNotifications();
    show(`${countLabel(count, 'AVISO', 'AVISOS')} en el sistema`);
  };

  return (
    <Group title="Debug">
      <GroupRow
        index={0}
        count={ROW_COUNT}
        icon={<BellIcon size={ROW_ICON} color={color.textMuted} />}
        label="Notificación ahora"
        onPress={sendNow}
      />
      <GroupRow
        index={1}
        count={ROW_COUNT}
        icon={<ClockIcon size={ROW_ICON} color={color.textMuted} />}
        label={`Notificación en ${DEBUG_DELAY_SECONDS} segundos`}
        onPress={sendDelayed}
      />
      <GroupRow
        index={2}
        count={ROW_COUNT}
        icon={<ListChecksIcon size={ROW_ICON} color={color.textMuted} />}
        label="Avisos programados"
        onPress={countScheduled}
      />
    </Group>
  );
}
