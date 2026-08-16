import { CONTRAST_LIFT, color } from './tokens';

/**
 * The accessibility promise the "Más contraste" setting makes, kept as a
 * test: with it on, no text colour may fall under WCAG AA, and the ordering
 * between the dim tones has to survive so the hierarchy still reads.
 *
 * Everything is measured against `card`, the lightest surface text sits on
 * and therefore the worst case in the palette.
 */

/**
 * WCAG AA for normal text. The large-text exemption of 3:1 is not an option
 * here: the dim tones are used at 8.5-10px.
 */
const AA_NORMAL = 4.5;

const WORST_SURFACE = color.card;

/** Relative luminance of a colour, per WCAG 2.1. */
function luminance(hex: string) {
  const value = parseInt(hex.slice(1), 16);
  const channel = (raw: number) => {
    const part = raw / 255;
    return part <= 0.04045 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4;
  };

  return (
    0.2126 * channel((value >> 16) & 255) +
    0.7152 * channel((value >> 8) & 255) +
    0.0722 * channel(value & 255)
  );
}

/** Contrast ratio between two colours, from 1:1 to 21:1. */
function contrast(first: string, second: string) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort(
    (one, other) => other - one,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

describe('contrast', () => {
  test('la escala de referencia es correcta: blanco sobre negro es 21:1', () => {
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 1);
  });

  test('un color consigo mismo es 1:1', () => {
    expect(contrast(color.card, color.card)).toBeCloseTo(1, 5);
  });
});

describe('iconos y controles', () => {
  /**
   * WCAG 1.4.11 asks 3:1 of anything that is not text but has to be seen.
   * These are met with the setting off, because an icon nobody can find is a
   * defect and not a preference.
   */
  const NON_TEXT = 3;

  test('los tonos de icono cumplen sin necesidad del ajuste', () => {
    for (const token of [
      color.icon,
      color.iconFaint,
      color.caret,
      color.knobOff,
    ] as const) {
      expect(contrast(token, WORST_SURFACE)).toBeGreaterThanOrEqual(NON_TEXT);
    }
  });

  test('conservan su orden: el caret sigue siendo mas tenue que el pomo', () => {
    expect(contrast(color.caret, WORST_SURFACE)).toBeLessThan(
      contrast(color.knobOff, WORST_SURFACE),
    );
  });
});

describe('con "Mas contraste" activado', () => {
  test('todo color elevado alcanza AA sobre la superficie mas clara', () => {
    for (const lifted of Object.values(CONTRAST_LIFT)) {
      expect(contrast(lifted, WORST_SURFACE)).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  test('cada color elevado contrasta mas que el original', () => {
    for (const [original, lifted] of Object.entries(CONTRAST_LIFT)) {
      expect(contrast(lifted, WORST_SURFACE)).toBeGreaterThan(
        contrast(original, WORST_SURFACE),
      );
    }
  });

  test('se conserva la jerarquia: lo mas apagado sigue siendo lo mas apagado', () => {
    const dimmest = CONTRAST_LIFT[color.ghost];
    const label = CONTRAST_LIFT[color.label];

    expect(contrast(dimmest, WORST_SURFACE)).toBeLessThan(
      contrast(label, WORST_SURFACE),
    );
  });

  test('una tarea completada sigue mas apagada que una etiqueta', () => {
    expect(contrast(CONTRAST_LIFT[color.textDisabled], WORST_SURFACE)).toBeLessThan(
      contrast(CONTRAST_LIFT[color.label], WORST_SURFACE),
    );
  });

  test('los colores que ya cumplian AA no se tocan', () => {
    for (const token of [color.text, color.textBody, color.textNote] as const) {
      expect(CONTRAST_LIFT[token]).toBeUndefined();
      expect(contrast(token, WORST_SURFACE)).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });
});
