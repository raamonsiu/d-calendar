import { calendarWindow, windowReach } from './calendarWindow';

const MS_PER_DAY = 86400000;

/** 11 ago 2026, 15:42: un dia y hora cualquiera dentro del mes. */
const MID_AUGUST_2026 = new Date(2026, 7, 11, 15, 42).getTime();

describe('calendarWindow', () => {
  test('cuadra a los limites del mes: primer y ultimo instante', () => {
    const { from, to } = calendarWindow(MID_AUGUST_2026);
    expect(from).toEqual(new Date(2025, 7, 1, 0, 0, 0, 0));
    expect(to).toEqual(new Date(2028, 7, 31, 23, 59, 59, 999));
  });

  test('el dia dentro del mes no cambia la ventana', () => {
    const first = calendarWindow(new Date(2026, 7, 1, 0, 0).getTime());
    const last = calendarWindow(new Date(2026, 7, 31, 23, 59).getTime());
    expect(first).toEqual(last);
  });

  test('cruza el cambio de año hacia atras', () => {
    const { from } = calendarWindow(new Date(2026, 0, 5).getTime());
    expect(from).toEqual(new Date(2025, 0, 1, 0, 0, 0, 0));
  });

  test('cruza el cambio de año hacia delante', () => {
    const { to } = calendarWindow(new Date(2026, 11, 20).getTime());
    expect(to).toEqual(new Date(2028, 11, 31, 23, 59, 59, 999));
  });

  test('respeta febrero bisiesto en el extremo final', () => {
    const { to } = calendarWindow(new Date(2026, 1, 15).getTime());
    expect(to).toEqual(new Date(2028, 1, 29, 23, 59, 59, 999));
  });
});

describe('windowReach', () => {
  test('cuenta los dias hasta cada borde desde un dia dentro de la ventana', () => {
    const today = new Date(2026, 7, 11);
    const reach = windowReach(today, MID_AUGUST_2026);

    expect(reach.before).toBe(375); // 1 ago 2025 -> 11 ago 2026
    expect(reach.after).toBe(751); // 11 ago 2026 -> 31 ago 2028
  });

  test('el primer dia de la ventana no retrocede', () => {
    const reach = windowReach(new Date(2025, 7, 1), MID_AUGUST_2026);
    expect(reach.before).toBe(0);
  });

  test('el ultimo dia de la ventana no avanza', () => {
    const reach = windowReach(new Date(2028, 7, 31), MID_AUGUST_2026);
    expect(reach.after).toBe(0);
  });

  test('un dia anterior a la ventana no da un before negativo', () => {
    const reach = windowReach(new Date(2020, 0, 1), MID_AUGUST_2026);
    expect(reach.before).toBe(0);
  });

  test('un dia posterior a la ventana no da un after negativo', () => {
    const reach = windowReach(new Date(2040, 0, 1), MID_AUGUST_2026);
    expect(reach.after).toBe(0);
  });

  test('el antes, el despues y el propio dia suman los dias de la ventana', () => {
    const { from, to } = calendarWindow(MID_AUGUST_2026);
    const totalDays = Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
    const reach = windowReach(new Date(2026, 7, 11), MID_AUGUST_2026);

    expect(reach.before + reach.after + 1).toBe(totalDays);
  });
});
