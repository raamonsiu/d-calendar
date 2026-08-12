import { guest } from '@/testing/fixtures';
import type { RelativeReminder, TimeReminder } from '@/types';
import {
  clampedEnd,
  eventChanged,
  guestRule,
  habitChanged,
  relativeReminderKey,
  sameMultiset,
  shiftedEnd,
  taskChanged,
  timeReminderKey,
  type EventSnapshot,
  type HabitSnapshot,
  type TaskSnapshot,
} from './useItemForm';

/** Reminder n minutes/hours/days before, ignoring the id `sameMultiset` does. */
const reminder = (value: number, unit: 0 | 1 | 2): RelativeReminder => ({
  id: `r-${value}-${unit}`,
  value,
  unit,
});

const baseEvent: EventSnapshot = {
  title: 'Reunión',
  description: 'notas',
  location: 'Sala 2',
  startsAt: 1000,
  endsAt: 2000,
  allDay: false,
  repeat: 'No',
  weekdays: [],
  calendarId: 'cal-1',
  availability: 'Ocupado',
  visibility: 'Predet.',
  guests: [guest('device:1'), guest('device:2')],
  reminders: [reminder(15, 0)],
};

describe('guestRule', () => {
  test('un evento propio y editable del dispositivo permite editar invitados', () => {
    const rule = guestRule({ notOwn: false, onDevice: true, canInvite: true });
    expect(rule.readOnly).toBe(false);
  });

  test('un evento que no es del usuario (form en solo lectura) bloquea los invitados', () => {
    const rule = guestRule({ notOwn: true, onDevice: true, canInvite: true });
    expect(rule.readOnly).toBe(true);
  });

  test('una suscripcion siempre esta bloqueada', () => {
    const rule = guestRule({ notOwn: true, onDevice: false, canInvite: false });
    expect(rule.readOnly).toBe(true);
  });

  test('un calendario del dispositivo sin soporte de invitados bloquea la lista', () => {
    const rule = guestRule({ notOwn: false, onDevice: true, canInvite: false });
    expect(rule.readOnly).toBe(true);
  });

  test('un calendario de la app permite invitados como nota, editables', () => {
    const rule = guestRule({ notOwn: false, onDevice: false, canInvite: false });
    expect(rule.readOnly).toBe(false);
  });
});

describe('shiftedEnd', () => {
  /** The minimum event length `useItemForm.ts` enforces, in ms. */
  const MIN_EVENT_MS = 60000;

  test('moviendo el inicio antes, mientras sigue antes del fin, el fin no se toca', () => {
    expect(shiftedEnd(1000, 400000, 500)).toBe(400000);
  });

  test('moviendo el inicio despues, mientras sigue antes del fin, el fin no se toca', () => {
    expect(shiftedEnd(1000, 400000, 4000)).toBe(400000);
  });

  test('mover el inicio justo al fin actual empuja el fin la misma duracion que tenia', () => {
    expect(shiftedEnd(1000, 400000, 400000)).toBe(400000 + 399000);
  });

  test('mover el inicio mas alla del fin actual conserva la duracion, no la invierte', () => {
    const startsAt = new Date(2026, 0, 1, 10, 0).getTime();
    const endsAt = new Date(2026, 0, 1, 11, 0).getTime();
    const nextStart = new Date(2026, 0, 3, 9, 0).getTime();

    expect(shiftedEnd(startsAt, endsAt, nextStart)).toBe(
      nextStart + (endsAt - startsAt),
    );
  });

  test('una duracion original menor al minimo no se propaga por debajo del minimo', () => {
    expect(shiftedEnd(1000, 1010, 5000)).toBe(5000 + MIN_EVENT_MS);
  });
});

describe('clampedEnd', () => {
  const MIN_EVENT_MS = 60000;

  test('un fin ya valido y suficientemente lejos no cambia', () => {
    expect(clampedEnd(1000, 1000 + MIN_EVENT_MS + 5000)).toBe(
      1000 + MIN_EVENT_MS + 5000,
    );
  });

  test('un fin anterior al inicio se sube al minimo tras el inicio', () => {
    expect(clampedEnd(5000, 1000)).toBe(5000 + MIN_EVENT_MS);
  });

  test('un fin igual al inicio tambien se sube al minimo', () => {
    expect(clampedEnd(5000, 5000)).toBe(5000 + MIN_EVENT_MS);
  });

  test('un fin justo un milisegundo por debajo del minimo se sube exactamente al minimo', () => {
    expect(clampedEnd(1000, 1000 + MIN_EVENT_MS - 1)).toBe(1000 + MIN_EVENT_MS);
  });

  test('un fin justo en el minimo no cambia', () => {
    expect(clampedEnd(1000, 1000 + MIN_EVENT_MS)).toBe(1000 + MIN_EVENT_MS);
  });
});

describe('sameMultiset', () => {
  test('el mismo contenido en otro orden cuenta como igual', () => {
    expect(sameMultiset([1, 3, 5], [5, 1, 3], String)).toBe(true);
  });

  test('dos listas vacias son iguales', () => {
    expect(sameMultiset([], [], String)).toBe(true);
  });

  test('un elemento distinto marca diferencia', () => {
    expect(sameMultiset([1, 3, 5], [1, 3, 6], String)).toBe(false);
  });

  test('un elemento de mas marca diferencia', () => {
    expect(sameMultiset([1, 3, 5], [1, 3, 5, 6], String)).toBe(false);
  });
});

describe('eventChanged', () => {
  test('sin tocar nada no hay cambios', () => {
    expect(eventChanged(baseEvent, { ...baseEvent })).toBe(false);
  });

  test('clonar las listas no cuenta como cambio', () => {
    expect(
      eventChanged(baseEvent, {
        ...baseEvent,
        weekdays: [...baseEvent.weekdays],
        guests: [...baseEvent.guests],
        reminders: [...baseEvent.reminders],
      }),
    ).toBe(false);
  });

  test.each([
    ['title', 'Otra reunión'],
    ['description', 'otras notas'],
    ['location', 'Sala 3'],
    ['startsAt', 1500],
    ['endsAt', 2500],
    ['allDay', true],
    ['calendarId', 'cal-2'],
    ['availability', 'Libre'],
    ['visibility', 'Privado'],
  ] as const)('cambiar %s se detecta', (field, value) => {
    expect(eventChanged(baseEvent, { ...baseEvent, [field]: value })).toBe(
      true,
    );
  });

  test('los mismos invitados en otro orden no son un cambio', () => {
    expect(
      eventChanged(baseEvent, {
        ...baseEvent,
        guests: [...baseEvent.guests].reverse(),
      }),
    ).toBe(false);
  });

  test('quitar un invitado es un cambio', () => {
    expect(
      eventChanged(baseEvent, { ...baseEvent, guests: [baseEvent.guests[0]] }),
    ).toBe(true);
  });

  test('añadir un invitado es un cambio', () => {
    expect(
      eventChanged(baseEvent, {
        ...baseEvent,
        guests: [...baseEvent.guests, guest('g-nuevo')],
      }),
    ).toBe(true);
  });

  test('la carga asincrona de invitados no cuenta como cambio cuando el baseline se actualiza con ella', () => {
    const openedBeforeGuestsLoaded: EventSnapshot = {
      ...baseEvent,
      guests: [],
    };
    // El baseline SIN actualizar veria la carga como un cambio falso.
    expect(eventChanged(openedBeforeGuestsLoaded, baseEvent)).toBe(true);
    // Actualizado junto con la carga (lo que hace initialGuests), no hay cambio.
    expect(
      eventChanged(
        { ...openedBeforeGuestsLoaded, guests: baseEvent.guests },
        baseEvent,
      ),
    ).toBe(false);
  });

  test('los mismos recordatorios en otro orden no son un cambio', () => {
    const twoReminders: EventSnapshot = {
      ...baseEvent,
      reminders: [reminder(15, 0), reminder(1, 1)],
    };
    expect(
      eventChanged(twoReminders, {
        ...twoReminders,
        reminders: [...twoReminders.reminders].reverse(),
      }),
    ).toBe(false);
  });

  test('un recordatorio con id nuevo pero mismo valor no es un cambio', () => {
    expect(
      eventChanged(baseEvent, {
        ...baseEvent,
        reminders: [{ id: 'otro-id', value: 15, unit: 0 }],
      }),
    ).toBe(false);
  });

  test('cambiar el valor de un recordatorio es un cambio', () => {
    expect(
      eventChanged(baseEvent, {
        ...baseEvent,
        reminders: [reminder(30, 0)],
      }),
    ).toBe(true);
  });

  test('los mismos dias de la semana en otro orden no son un cambio', () => {
    const weekly: EventSnapshot = {
      ...baseEvent,
      repeat: 'Días de la semana',
      weekdays: [1, 3, 5],
    };
    expect(eventChanged(weekly, { ...weekly, weekdays: [5, 1, 3] })).toBe(
      false,
    );
  });

  test('un dia de la semana distinto es un cambio', () => {
    const weekly: EventSnapshot = {
      ...baseEvent,
      repeat: 'Días de la semana',
      weekdays: [1, 3, 5],
    };
    expect(eventChanged(weekly, { ...weekly, weekdays: [1, 3, 6] })).toBe(
      true,
    );
  });
});

describe('taskChanged', () => {
  const baseTask: TaskSnapshot = {
    title: 'Comprar pan',
    description: '',
    dueAt: 5000,
    hasTime: true,
    vagueMonth: null,
    reminders: [],
  };

  test('sin tocar nada no hay cambios', () => {
    expect(taskChanged(baseTask, { ...baseTask })).toBe(false);
  });

  test('cambiar la fecha limite es un cambio', () => {
    expect(taskChanged(baseTask, { ...baseTask, dueAt: 6000 })).toBe(true);
  });

  test('cambiar el mes aproximado es un cambio', () => {
    expect(
      taskChanged(baseTask, { ...baseTask, vagueMonth: 'Agosto' }),
    ).toBe(true);
  });
});

describe('habitChanged', () => {
  const baseHabit: HabitSnapshot = {
    name: 'Leer',
    description: '',
    frequency: 'Diario',
    target: 1,
    weekdays: [],
    reminders: [{ id: 't1', time: '09:00' } as TimeReminder],
  };

  test('sin tocar nada no hay cambios', () => {
    expect(habitChanged(baseHabit, { ...baseHabit })).toBe(false);
  });

  test('cambiar la frecuencia es un cambio', () => {
    expect(
      habitChanged(baseHabit, { ...baseHabit, frequency: 'Semanal' }),
    ).toBe(true);
  });

  test('cambiar el objetivo es un cambio', () => {
    expect(habitChanged(baseHabit, { ...baseHabit, target: 3 })).toBe(true);
  });

  test('un recordatorio con id nuevo pero misma hora no es un cambio', () => {
    expect(
      habitChanged(baseHabit, {
        ...baseHabit,
        reminders: [{ id: 'otro', time: '09:00' }],
      }),
    ).toBe(false);
  });

  test('cambiar la hora del recordatorio es un cambio', () => {
    expect(
      habitChanged(baseHabit, {
        ...baseHabit,
        reminders: [{ id: 't1', time: '10:00' }],
      }),
    ).toBe(true);
  });
});

describe('las claves de recordatorio ignoran el id', () => {
  test('relativeReminderKey solo mira valor y unidad', () => {
    expect(relativeReminderKey({ id: 'a', value: 15, unit: 0 })).toBe('15:0');
    expect(relativeReminderKey({ id: 'b', value: 15, unit: 0 })).toBe('15:0');
  });

  test('timeReminderKey solo mira la hora', () => {
    expect(timeReminderKey({ id: 'a', time: '09:00' })).toBe('09:00');
  });
});
