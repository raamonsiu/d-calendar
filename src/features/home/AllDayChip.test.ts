import { CHIP_GAP, CHIP_HEIGHT, allDayHeight } from './AllDayChip';

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
