import { Pressable, StyleSheet, View } from 'react-native';

import { fmtTime } from '@/lib/date';
import { T } from '@/theme/Text';
import { color, hitSlopFor, radius } from '@/theme/tokens';
import { DashedButton } from '@/ui/controls';
import { BellIcon, PlusIcon, XIcon } from '@/ui/icons';
import { uid } from '@/store/useAppStore';
import type { RelReminder, RelUnit, TimeReminder } from '@/types';
import { ControlButton, FormBlock } from './blocks';

const REL_UNITS = ['MINUTOS ANTES', 'HORAS ANTES', 'DÍAS ANTES'];
const REL_VALUES = [5, 10, 15, 30, 45];

type Common = {
  /** Se llama tras añadir, para que el formulario baje hasta el aviso nuevo. */
  onAdded: () => void;
};

type RelProps = Common & {
  kind: 'relative';
  reminders: RelReminder[];
  onChange: (next: RelReminder[]) => void;
};

type TimeProps = Common & {
  kind: 'time';
  reminders: TimeReminder[];
  onChange: (next: TimeReminder[]) => void;
  /** Etiqueta de la derecha: depende de si el hábito es semanal. */
  unitLabel: string;
  onPickTime: (current: string, apply: (time: string) => void) => void;
};

/**
 * Caja de notificaciones, común a los tres tipos. Los eventos y las tareas
 * avisan «n minutos/horas/días antes»; los hábitos, a horas del día.
 */
export function RemindersBlock(props: RelProps | TimeProps) {
  const count =
    props.kind === 'time'
      ? `${props.reminders.length} ${props.reminders.length === 1 ? 'HORA' : 'HORAS'}`
      : `${props.reminders.length} ${props.reminders.length === 1 ? 'AVISO' : 'AVISOS'}`;

  const removeButton = (onPress: () => void, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={hitSlopFor(30)}
      onPress={onPress}
      style={styles.remove}>
      <XIcon size={13} color="#4a4a52" />
    </Pressable>
  );

  return (
    <FormBlock
      last
      title="NOTIFICACIONES"
      right={<T style={styles.count}>{count}</T>}>
      <View style={styles.list}>
        {props.kind === 'time'
          ? props.reminders.map((r) => (
              <View key={r.id} style={styles.row}>
                <BellIcon size={13} color={color.labelDim} />
                <ControlButton
                  center
                  height={36}
                  width={72}
                  label={r.time}
                  onPress={() =>
                    props.onPickTime(r.time, (time) =>
                      props.onChange(
                        props.reminders.map((x) =>
                          x.id === r.id ? { ...x, time } : x,
                        ),
                      ),
                    )
                  }
                />
                <View style={styles.unit}>
                  <T numberOfLines={1} style={styles.unitLabel}>
                    {props.unitLabel}
                  </T>
                </View>
                {removeButton(
                  () =>
                    props.onChange(props.reminders.filter((x) => x.id !== r.id)),
                  'Quitar hora',
                )}
              </View>
            ))
          : props.reminders.map((r) => (
              <View key={r.id} style={styles.row}>
                <BellIcon size={13} color={color.labelDim} />
                <ControlButton
                  center
                  height={36}
                  width={62}
                  label={String(r.value)}
                  onPress={() =>
                    props.onChange(
                      props.reminders.map((x) =>
                        x.id === r.id
                          ? {
                              ...x,
                              value:
                                REL_VALUES[
                                  (REL_VALUES.indexOf(x.value) + 1) %
                                    REL_VALUES.length
                                ],
                            }
                          : x,
                      ),
                    )
                  }
                />
                <ControlButton
                  grow
                  height={36}
                  label={REL_UNITS[r.unit]}
                  onPress={() =>
                    props.onChange(
                      props.reminders.map((x) =>
                        x.id === r.id
                          ? { ...x, unit: (((x.unit + 1) % 3) as RelUnit) }
                          : x,
                      ),
                    )
                  }
                />
                {removeButton(
                  () =>
                    props.onChange(props.reminders.filter((x) => x.id !== r.id)),
                  'Quitar aviso',
                )}
              </View>
            ))}
      </View>

      <DashedButton
        label={props.kind === 'time' ? 'AÑADIR HORA' : 'AÑADIR AVISO'}
        icon={<PlusIcon size={12} color={color.textMuted} />}
        onPress={() => {
          if (props.kind === 'time') {
            props.onChange([
              ...props.reminders,
              { id: uid('r'), time: fmtTime(new Date(2000, 0, 1, 21, 0)) },
            ]);
          } else {
            props.onChange([
              ...props.reminders,
              { id: uid('r'), value: 30, unit: 0 },
            ]);
          }
          props.onAdded();
        }}
      />
    </FormBlock>
  );
}

const styles = StyleSheet.create({
  count: { fontSize: 9, letterSpacing: 1.2, color: color.faint },
  list: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unit: {
    flex: 1,
    height: 36,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.card,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  unitLabel: { fontSize: 11.5, letterSpacing: 0.3, color: '#b9b9c1' },
  remove: {
    width: 26,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
