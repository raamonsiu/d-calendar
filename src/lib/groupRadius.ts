import type { ViewStyle } from 'react-native';

/**
 * El «gap Nothing» (handoff §4). El radio de la esquina que da al gap es menor
 * que el de la exterior: primero 26/9, intermedios 9, último 9/26.
 *
 * Ajustes y Ayuda usan (26, 9). La vista semanal, en horizontal, usa (17, 6).
 */
export function groupRadius(
  i: number,
  n: number,
  outer = 26,
  inner = 9,
  axis: 'vertical' | 'horizontal' = 'vertical',
): ViewStyle {
  if (n === 1) return { borderRadius: outer };

  const first = i === 0;
  const last = i === n - 1;

  if (axis === 'vertical') {
    return {
      borderTopLeftRadius: first ? outer : inner,
      borderTopRightRadius: first ? outer : inner,
      borderBottomLeftRadius: last ? outer : inner,
      borderBottomRightRadius: last ? outer : inner,
    };
  }

  return {
    borderTopLeftRadius: first ? outer : inner,
    borderBottomLeftRadius: first ? outer : inner,
    borderTopRightRadius: last ? outer : inner,
    borderBottomRightRadius: last ? outer : inner,
  };
}
