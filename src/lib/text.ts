/** Interface string formatting. */

/**
 * Letter drawn inside a round avatar (accounts and guests).
 *
 * Precondition: `value` may come in empty, because it comes from a text field
 * the user is still typing into. Postcondition: always returns a single
 * uppercase character, or '?' when there was nothing to use.
 *
 * @param value Name or email to take the initial from.
 */
export const avatarInitial = (value: string) =>
  (value.trim()[0] ?? '?').toUpperCase();

/**
 * A count with its unit in singular or plural, in the uppercase format of the
 * micro labels: "1 CUENTA", "3 CUENTAS".
 *
 * @param count Amount to show.
 * @param singular Unit when the amount is 1.
 * @param plural Unit for any other amount.
 */
export const countLabel = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;
