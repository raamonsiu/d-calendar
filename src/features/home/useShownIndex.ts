import { useRef } from 'react';

/**
 * Reports which item of a scrolling list is showing, once per change.
 *
 * The four views of the calendar box all do the same thing while scrolling:
 * work out which day, week or month they have reached, and tell Home about it.
 * They differ only in the arithmetic that gets to the index, which is why that
 * part stays in each of them and this part does not.
 *
 * Reporting on every frame would set state dozens of times a second for a value
 * that changes once a page; the last index reported lives in a ref so the guard
 * costs nothing and never causes a render of its own.
 *
 * Precondition: `openingIndex` is the item the list mounts on, so the scroll
 * event the mount itself produces reports nothing. Postcondition: returns a
 * function that calls `onChange` only when the index it is given differs from
 * the last one it accepted.
 *
 * @param openingIndex Item the list starts on.
 * @param onChange Called with the new index, once per change.
 */
export function useShownIndex(
  openingIndex: number,
  onChange: (index: number) => void,
) {
  const shown = useRef(openingIndex);

  return (index: number) => {
    if (index === shown.current) return;
    shown.current = index;
    onChange(index);
  };
}
