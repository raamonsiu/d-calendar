import { Platform } from 'react-native';

import { toDeviceId } from '@/lib/sourceIds';
import { guest } from '@/testing/fixtures';
import type { Guest } from '@/types';
import {
  guestDiff,
  instanceStartDate,
  occurrenceStart,
  shiftedStart,
} from './deviceCalendars';

describe('occurrenceStart', () => {
  test('lee el instante que toAppEvent puso al final del id', () => {
    const start = new Date(2026, 8, 15, 10, 0).getTime();
    expect(occurrenceStart(toDeviceId(`4821:${start}`))).toBe(start);
  });

  test('funciona igual con un id de evento de iOS, que ya lleva dos puntos', () => {
    const start = new Date(2026, 8, 15, 10, 0).getTime();
    const iosId = toDeviceId(`1D6A0E1F-3B2C:20260915T080000Z:${start}`);
    expect(occurrenceStart(iosId)).toBe(start);
  });

  test('un id sin dos puntos no tiene inicio', () => {
    expect(occurrenceStart('device')).toBeNull();
  });

  test('una cola no numerica no tiene inicio', () => {
    expect(occurrenceStart('device:abc:xyz')).toBeNull();
  });

  test('una cola vacia no tiene inicio (Number(\'\') es 0, que no vale)', () => {
    expect(occurrenceStart('device:4821:')).toBeNull();
  });

  test('un id sin prefijo tampoco tiene inicio', () => {
    expect(occurrenceStart('123456')).toBeNull();
  });
});

describe('instanceStartDate', () => {
  const originalOS = Platform.OS;
  afterEach(() => {
    Platform.OS = originalOS;
  });

  test('en Android escribe los milisegundos tal cual, que es lo que toLong() espera', () => {
    Platform.OS = 'android';
    const instant = Date.UTC(2026, 8, 15, 8, 0, 0);
    expect(instanceStartDate(instant)).toBe(String(instant));
    expect(Number(instanceStartDate(instant))).toBe(instant);
  });

  test('en iOS escribe ISO en UTC, que es lo que su formateador espera', () => {
    Platform.OS = 'ios';
    const instant = Date.UTC(2026, 8, 15, 8, 0, 0);
    expect(instanceStartDate(instant)).toBe('2026-09-15T08:00:00.000Z');
  });
});

describe('shiftedStart', () => {
  test('mover una ocurrencia una hora mueve la serie la misma hora, no al dia de la ocurrencia', () => {
    const seriesStart = new Date(2026, 8, 1, 10, 0).getTime();
    const occurrence = new Date(2026, 8, 15, 10, 0).getTime();
    const movedTo = new Date(2026, 8, 15, 11, 0).getTime();

    const result = shiftedStart(seriesStart, occurrence, movedTo);

    expect(result).toEqual(new Date(2026, 8, 1, 11, 0));
    expect(result.getDate()).toBe(1);
  });

  test('mover un dia entero mueve la serie un dia entero', () => {
    const seriesStart = new Date(2026, 8, 1, 10, 0).getTime();
    const occurrence = new Date(2026, 8, 15, 10, 0).getTime();
    const nextDay = new Date(2026, 8, 16, 10, 0).getTime();

    expect(shiftedStart(seriesStart, occurrence, nextDay)).toEqual(
      new Date(2026, 8, 2, 10, 0),
    );
  });

  test('adelantar la ocurrencia adelanta la serie lo mismo', () => {
    const seriesStart = new Date(2026, 8, 1, 10, 0).getTime();
    const occurrence = new Date(2026, 8, 15, 10, 0).getTime();
    const earlier = new Date(2026, 8, 15, 8, 30).getTime();

    expect(shiftedStart(seriesStart, occurrence, earlier)).toEqual(
      new Date(2026, 8, 1, 8, 30),
    );
  });

  test('sin desplazamiento la serie no se mueve', () => {
    const seriesStart = new Date(2026, 8, 1, 10, 0).getTime();
    const occurrence = new Date(2026, 8, 15, 10, 0).getTime();

    expect(shiftedStart(seriesStart, occurrence, occurrence)).toEqual(
      new Date(seriesStart),
    );
  });
});

describe('guestDiff', () => {
  const idsOf = (guests: Guest[]) => guests.map((entry) => entry.id);
  const before = [guest('device:1'), guest('device:2')];

  test('sin cambios no hay nada que quitar ni que invitar', () => {
    const { removeIds, toInvite } = guestDiff(idsOf(before), before);
    expect(removeIds).toEqual([]);
    expect(toInvite).toEqual([]);
  });

  test('quitar un invitado solo lo marca a el para eliminar', () => {
    const { removeIds, toInvite } = guestDiff(idsOf(before), [before[0]]);
    expect(removeIds).toEqual(['device:2']);
    expect(toInvite).toEqual([]);
  });

  test('anyadir un invitado nuevo solo lo marca a el para invitar', () => {
    const nuevo = guest('g-nuevo');
    const { removeIds, toInvite } = guestDiff(idsOf(before), [
      ...before,
      nuevo,
    ]);
    expect(removeIds).toEqual([]);
    expect(toInvite).toEqual([nuevo]);
  });

  test('quitar uno y anyadir otro a la vez hace las dos cosas', () => {
    const nuevo = guest('g-nuevo');
    const { removeIds, toInvite } = guestDiff(idsOf(before), [
      before[0],
      nuevo,
    ]);
    expect(removeIds).toEqual(['device:2']);
    expect(toInvite).toEqual([nuevo]);
  });

  test('un invitado nuevo sin correo nunca se invita', () => {
    const sinCorreo = { ...guest('g-x'), email: '' };
    const { toInvite } = guestDiff([], [sinCorreo]);
    expect(toInvite).toEqual([]);
  });

  test('vaciar la lista entera marca a todos para eliminar', () => {
    const { removeIds } = guestDiff(idsOf(before), []);
    expect(removeIds).toEqual(['device:1', 'device:2']);
  });

  test('un evento recien creado no tiene nada que eliminar, solo invitar', () => {
    const guests = [guest('g-1'), guest('g-2')];
    const { removeIds, toInvite } = guestDiff([], guests);

    expect(removeIds).toEqual([]);
    expect(toInvite).toEqual(guests);
  });

  test('el mismo invitado dos veces no duplica la invitacion', () => {
    const existing = guest('device:1');
    const { toInvite } = guestDiff([existing.id], [existing, existing]);
    expect(toInvite).toEqual([]);
  });
});
