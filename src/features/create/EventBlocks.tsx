import { Pressable, StyleSheet, View } from 'react-native';

import { formatLongDate, formatTime, withTime } from '@/lib/date';
import { AppText, Label } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color, hitSlopFor, radius } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Chip } from '@/ui/Chip';
import { DashedButton, Divider } from '@/ui/controls';
import { UserPlusIcon, XIcon } from '@/ui/icons';
import type { DateTimePicker } from '@/ui/pickers';
import type { Availability, RepeatRule, Visibility } from '@/types';
import { WeekdayChips } from './WeekdayChips';
import {
  BlockSwitch,
  ChipWrap,
  ControlButton,
  FieldRow,
  FormBlock,
} from './blocks';
import type { ItemFormState } from './useItemForm';

const REPEAT_OPTIONS: RepeatRule[] = [
  'No',
  'Cada día',
  'Días de la semana',
  'Cada mes',
];
const AVAILABILITY_OPTIONS: Availability[] = ['Ocupado', 'Libre'];
const VISIBILITY_OPTIONS: Visibility[] = ['Predet.', 'Privado', 'Público'];

/** Width of the time control, so INICIO and FIN stay aligned. */
const TIME_WIDTH = 74;

/** Label width for the second box, whose labels are longer. */
const WIDE_LABEL = 76;

type EventBlocksProps = {
  form: ItemFormState;
  picker: DateTimePicker;
  /** Opens the add-guest sheet, which lives on the screen. */
  onAddGuest: () => void;
};

/**
 * The three boxes specific to an event: when it happens, which calendar it goes
 * in and who is invited.
 *
 * With "TODO EL DÍA" on, the time controls dim and stop opening the picker. The
 * weekday row only shows up with the "Días de la semana" repeat rule, and the
 * guest list only when there is at least one guest.
 */
export function EventBlocks({ form, picker, onAddGuest }: EventBlocksProps) {
  const accent = useAccent();
  const { event } = form;

  const bounds = [
    { label: 'INICIO', value: event.startsAt, setValue: event.setStartsAt },
    { label: 'FIN', value: event.endsAt, setValue: event.setEndsAt },
  ];

  return (
    <>
      <FormBlock
        first
        title="CUÁNDO"
        right={
          <BlockSwitch
            label="TODO EL DÍA"
            value={event.allDay}
            onChange={event.setAllDay}
          />
        }>
        <View style={styles.rows}>
          {bounds.map(({ label, value, setValue }) => (
            <FieldRow key={label} label={label}>
              <ControlButton
                grow
                label={formatLongDate(value)}
                onPress={() =>
                  picker.open('date', value, (picked) =>
                    setValue(withTime(picked, value)),
                  )
                }
              />
              <ControlButton
                center
                width={TIME_WIDTH}
                muted={event.allDay}
                label={event.allDay ? '—' : formatTime(value)}
                onPress={() => {
                  if (event.allDay) return;
                  picker.open('time', value, (picked) =>
                    setValue(withTime(value, picked)),
                  );
                }}
              />
            </FieldRow>
          ))}
        </View>

        <View style={styles.rows}>
          <Label>Repetir</Label>
          <ChipWrap>
            {REPEAT_OPTIONS.map((option) => (
              <Chip
                key={option}
                height={29}
                label={option}
                selected={event.repeat === option}
                onPress={() => event.setRepeat(option)}
              />
            ))}
          </ChipWrap>
          {event.repeat === 'Días de la semana' ? (
            <WeekdayChips
              selected={event.weekdays}
              onToggle={event.toggleWeekday}
            />
          ) : null}
        </View>
      </FormBlock>

      <FormBlock title="CALENDARIO">
        <ChipWrap>
          {form.writableCalendars.map((calendar) => (
            <Chip
              key={calendar.id}
              label={calendar.name}
              dotColor={calendar.dotColor ?? accent}
              selected={event.calendarId === calendar.id}
              onPress={() => event.setCalendarId(calendar.id)}
            />
          ))}
        </ChipWrap>

        <Divider />

        <View style={styles.optionRows}>
          <FieldRow label="DISPONIB." labelWidth={WIDE_LABEL}>
            <View style={styles.optionRow}>
              {AVAILABILITY_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  grow
                  label={option}
                  selected={event.availability === option}
                  onPress={() => event.setAvailability(option)}
                />
              ))}
            </View>
          </FieldRow>
          <FieldRow label="VISIBILIDAD" labelWidth={WIDE_LABEL}>
            <View style={styles.optionRow}>
              {VISIBILITY_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  grow
                  label={option}
                  selected={event.visibility === option}
                  onPress={() => event.setVisibility(option)}
                />
              ))}
            </View>
          </FieldRow>
        </View>
      </FormBlock>

      <FormBlock title="INVITAR">
        {event.guests.length ? (
          <View style={styles.guestList}>
            {event.guests.map((guest) => (
              <View key={guest.id} style={styles.guestRow}>
                <Avatar initial={guest.initial} />
                <AppText numberOfLines={1} style={styles.guestName}>
                  {guest.name}
                </AppText>
                <AppText style={styles.guestState}>{guest.state}</AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar a ${guest.name}`}
                  hitSlop={hitSlopFor(24)}
                  onPress={() => event.removeGuest(guest.id)}
                  style={styles.removeGuest}>
                  <XIcon size={12} color={color.iconFaint} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <DashedButton
          label="AÑADIR INVITADO"
          icon={<UserPlusIcon size={13} color={color.textMuted} />}
          onPress={onAddGuest}
        />
      </FormBlock>
    </>
  );
}

const styles = StyleSheet.create({
  rows: { gap: 7 },
  optionRows: { gap: 8 },
  optionRow: { flex: 1, flexDirection: 'row', gap: 4 },
  guestList: { gap: 6 },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 36 },
  guestName: { flex: 1, fontSize: 12.5, color: color.textSoft },
  guestState: { fontSize: 9, letterSpacing: 1.1, color: color.labelDim },
  removeGuest: {
    width: 26,
    height: 30,
    borderRadius: radius.joined,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
