import { Pressable, StyleSheet, View } from 'react-native';

import { formatLongDate, formatTime, withTime } from '@/lib/date';
import { AppText, Label } from '@/theme/Text';
import { color, hitSlopFor, radius } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { CalendarDot } from '@/ui/CalendarDot';
import { Chip } from '@/ui/Chip';
import { Field } from '@/ui/Field';
import { DashedButton, Divider } from '@/ui/controls';
import { CaretDownIcon, UserPlusIcon, XIcon } from '@/ui/icons';
import type { DateTimePicker } from '@/ui/pickers';
import type { Availability, Visibility } from '@/types';
import { WeekdayChips } from './WeekdayChips';
import {
  BlockSwitch,
  ChipWrap,
  ControlButton,
  FieldRow,
  FormBlock,
} from './blocks';
import type { ItemFormState } from './useItemForm';

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
  /** Opens the destination calendar sheet, which lives on the screen too. */
  onPickCalendar: () => void;
};

/**
 * The three boxes specific to an event: when it happens, which calendar it goes
 * in and who is invited.
 *
 * With "TODO EL DÍA" on, the time controls dim and stop opening the picker. The
 * weekday row only shows up with the "Días de la semana" repeat rule, and the
 * guest list only when there is at least one guest.
 *
 * On one occurrence of a repetition of the device the box closes with a line
 * saying so, and FIN dims the same way: the length of a repetition is not the
 * app's to change, and it follows INICIO instead of being chosen.
 *
 * Three things follow the destination calendar. The repeat rules offered are the
 * ones that calendar can hold, so choosing one of the device may leave fewer
 * chips; the INVITAR box always closes with a line saying where the guests end
 * up, and drops the button to add one where they cannot be touched; and the
 * visibility row disappears on an event of the device, which is the one place a
 * save cannot carry it.
 */
export function EventBlocks({
  form,
  picker,
  onAddGuest,
  onPickCalendar,
}: EventBlocksProps) {
  const { event } = form;

  const bounds = [
    {
      label: 'INICIO',
      value: event.startsAt,
      setValue: event.setStartsAt,
      locked: false,
    },
    {
      label: 'FIN',
      value: event.endsAt,
      setValue: event.setEndsAt,
      locked: event.endLocked,
    },
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
          {bounds.map(({ label, value, setValue, locked }) => (
            <FieldRow key={label} label={label}>
              <ControlButton
                grow
                muted={locked}
                label={formatLongDate(value)}
                onPress={() => {
                  if (locked) return;
                  picker.open('date', value, (picked) =>
                    setValue(withTime(picked, value)),
                  );
                }}
              />
              <ControlButton
                center
                width={TIME_WIDTH}
                muted={event.allDay || locked}
                label={event.allDay ? '-' : formatTime(value)}
                onPress={() => {
                  if (event.allDay || locked) return;
                  picker.open('time', value, (picked) =>
                    setValue(withTime(value, picked)),
                  );
                }}
              />
            </FieldRow>
          ))}
        </View>

        {event.seriesNote ? (
          <AppText style={styles.seriesNote}>{event.seriesNote}</AppText>
        ) : null}

        {event.repeatShown ? (
          <View style={styles.rows}>
            <Label>Repetir</Label>
            <ChipWrap>
              {event.repeatOptions.map((option) => (
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
        ) : null}
      </FormBlock>

      <FormBlock title="UBICACIÓN">
        <Field
          placeholder="Dónde"
          value={event.location}
          onChangeText={event.setLocation}
        />
      </FormBlock>

      <FormBlock title="CALENDARIO">
        <ControlButton
          label={form.selectedCalendar?.name ?? 'Sin calendario'}
          leading={
            <CalendarDot color={form.selectedCalendar?.dotColor ?? null} />
          }
          icon={<CaretDownIcon size={11} color={color.caret} />}
          onPress={onPickCalendar}
        />

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
          {event.visibilityShown ? (
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
          ) : null}
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
                {event.guestsReadOnly ? null : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar a ${guest.name}`}
                    hitSlop={hitSlopFor(24)}
                    onPress={() => event.removeGuest(guest.id)}
                    style={styles.removeGuest}>
                    <XIcon size={12} color={color.iconFaint} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        ) : null}

        {event.guestsReadOnly ? null : (
          <DashedButton
            label="AÑADIR INVITADO"
            icon={<UserPlusIcon size={13} color={color.textMuted} />}
            onPress={onAddGuest}
          />
        )}

        <AppText style={styles.guestNote}>{event.guestsNote}</AppText>
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
  guestNote: { fontSize: 11, lineHeight: 16, color: color.textMuted },
  seriesNote: { fontSize: 11, lineHeight: 16, color: color.textMuted },
  removeGuest: {
    width: 26,
    height: 30,
    borderRadius: radius.joined,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
