/**
 * Immutable operations on lists. Both the store and the forms use them: in both
 * places the pattern is the same, a list of items with an `id` that gets
 * replaced whole on every change.
 */

type Identifiable = { id: string };

/**
 * Adds a value to a multiple-selection list, or removes it when already there.
 *
 * Precondition: `list` has no duplicates. Postcondition: returns a new list;
 * the original is left untouched. The added value goes last, so the list order
 * is the selection order.
 *
 * @param list Values currently selected.
 * @param value Value that was just tapped.
 */
export function toggleInList<Value>(list: Value[], value: Value): Value[] {
  return list.includes(value)
    ? list.filter((current) => current !== value)
    : [...list, value];
}

/**
 * Applies partial changes to the item with a given id.
 *
 * Postcondition: returns a new list of the same length and in the same order.
 * When the id is not there, it returns an unchanged copy.
 *
 * @param list List of items with an id.
 * @param id Id of the item to change.
 * @param patch Fields to overwrite.
 */
export function patchById<Item extends Identifiable>(
  list: Item[],
  id: string,
  patch: Partial<Item>,
): Item[] {
  return list.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

/**
 * Removes the item with a given id.
 *
 * Postcondition: returns a new list. When the id is not there, it returns a
 * copy with the same items.
 *
 * @param list List of items with an id.
 * @param id Id of the item to remove.
 */
export function withoutId<Item extends Identifiable>(
  list: Item[],
  id: string,
): Item[] {
  return list.filter((item) => item.id !== id);
}

/**
 * Inserts an item at a given position, which is what undo needs: the item goes
 * back where it was.
 *
 * Precondition: `index` may fall out of range; it is clamped to the end of the
 * list in that case. Postcondition: returns a new list with one more item.
 *
 * @param list Destination list.
 * @param index Position to insert at.
 * @param item Item to insert.
 */
export function insertAt<Item>(
  list: Item[],
  index: number,
  item: Item,
): Item[] {
  const next = [...list];
  next.splice(Math.min(Math.max(0, index), next.length), 0, item);
  return next;
}

/**
 * Next value of a cyclic list, which is how reminders are edited: every tap on
 * the control moves to the next value and wraps around at the end.
 *
 * Precondition: `list` is not empty. Postcondition: when `current` is not in
 * the list, the first value is returned.
 *
 * @param list Possible values, in the order they are cycled through.
 * @param current Value currently on screen.
 */
export function nextInCycle<Value>(list: Value[], current: Value): Value {
  return list[(list.indexOf(current) + 1) % list.length];
}
