import type { CalEvent } from '@/types';
import { CHIP_GAP, CHIP_HEIGHT, allDayBand, allDayHeight } from './allDayBand';

describe('allDayHeight', () => {
  test('sin eventos no ocupa nada', () => {
    expect(allDayHeight(0, 2)).toBe(0);
  });

  test('un evento ocupa una fila', () => {
    expect(allDayHeight(1, 2)).toBe(CHIP_HEIGHT + CHIP_GAP);
  });

  test('el tope corta aunque haya mas eventos', () => {
    expect(allDayHeight(9, 2)).toBe(allDayHeight(2, 2));
  });

  test('el tope de la vista extensa (3 filas) da mas altura que el de HOY (2)', () => {
    expect(allDayHeight(9, 3)).toBeGreaterThan(allDayHeight(9, 2));
    expect(allDayHeight(9, 3)).toBe(3 * (CHIP_HEIGHT + CHIP_GAP));
  });

  test('justo en el tope no hay contador de sobra que contar', () => {
    expect(allDayHeight(2, 2)).toBe(2 * (CHIP_HEIGHT + CHIP_GAP));
  });
});

describe('allDayBand', () => {
  /** All-day events of a day, as many as a test asks for. */
  const holidays = (count: number) =>
    Array.from(
      { length: count },
      (_, index) => ({ id: `h${index}`, title: `Holiday ${index}` }) as CalEvent,
    );

  test('names every event while they fit', () => {
    const events = holidays(3);
    expect(allDayBand(events, 3)).toEqual({ shown: events, more: 0 });
  });

  test('past the limit names one fewer and gives the last row to the count', () => {
    const { shown, more } = allDayBand(holidays(5), 3);
    expect(shown.map((event) => event.id)).toEqual(['h0', 'h1']);
    expect(more).toBe(3);
  });

  test('one over the limit still counts two, never "+1"', () => {
    expect(allDayBand(holidays(4), 3).more).toBe(2);
  });

  test('a day with nothing all-day has nothing to show or count', () => {
    expect(allDayBand([], 3)).toEqual({ shown: [], more: 0 });
  });
});
