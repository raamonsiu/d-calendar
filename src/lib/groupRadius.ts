import type { ViewStyle } from 'react-native';

import { radius } from '@/theme/tokens';

/**
 * Radii of the separated "gap Nothing" (handoff §4). The corner facing the gap
 * between two elements gets a smaller radius than the outer one: the first
 * opens 26/9, the middle ones stay at 9 and the last closes 9/26.
 *
 * Settings and Help use the defaults. The week view, which groups horizontally,
 * passes (17, 6) and `axis: 'horizontal'`.
 *
 * Precondition: `count` is greater than 0 and `index` is between 0 and `count -
 * 1`. Postcondition: returns radius properties only, so it composes with any
 * other style. With `count === 1` the element is rounded on all four corners.
 *
 * @param index Position of the element inside the group.
 * @param count How many elements the group has.
 * @param outer Radius of the corners facing outside the group.
 * @param inner Radius of the corners facing a gap.
 * @param axis Direction the elements are stacked in.
 */
export function groupRadius(
  index: number,
  count: number,
  outer: number = radius.box,
  inner: number = radius.joined,
  axis: 'vertical' | 'horizontal' = 'vertical',
): ViewStyle {
  if (count === 1) return { borderRadius: outer };

  const isFirst = index === 0;
  const isLast = index === count - 1;

  if (axis === 'vertical') {
    return {
      borderTopLeftRadius: isFirst ? outer : inner,
      borderTopRightRadius: isFirst ? outer : inner,
      borderBottomLeftRadius: isLast ? outer : inner,
      borderBottomRightRadius: isLast ? outer : inner,
    };
  }

  return {
    borderTopLeftRadius: isFirst ? outer : inner,
    borderBottomLeftRadius: isFirst ? outer : inner,
    borderTopRightRadius: isLast ? outer : inner,
    borderBottomRightRadius: isLast ? outer : inner,
  };
}
