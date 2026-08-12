import { ScrollView, StyleSheet } from 'react-native';

import type { CalendarOption } from '@/store/selectors';
import { CalendarDot } from '@/ui/CalendarDot';
import { Sheet } from '@/ui/Sheet';
import { OptionRow } from '@/ui/controls';

/**
 * Room the list gets before it starts scrolling. A phone with several accounts
 * holds dozens of calendars, and a sheet as tall as the screen stops looking
 * like a sheet.
 */
const MAX_HEIGHT = 320;

/**
 * Sheet that picks a calendar.
 *
 * It is shared by the two places that choose one: the destination of an event
 * in Crear and the default calendar in Ajustes, so both read the same: colour
 * dot, name, and the line saying which account it hangs from. The options come
 * built from `calendarOptions`, which is where that line is decided.
 */
export function CalendarPickerSheet({
  open,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  open: boolean;
  title: string;
  options: CalendarOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
        {options.map((calendar) => (
          <OptionRow
            key={calendar.id}
            label={calendar.name}
            hint={calendar.hint}
            leading={<CalendarDot color={calendar.dotColor} />}
            selected={selectedId === calendar.id}
            onPress={() => {
              onSelect(calendar.id);
              onClose();
            }}
          />
        ))}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: MAX_HEIGHT },
});
