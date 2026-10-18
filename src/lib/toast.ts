/**
 * Timing arithmetic of the toasts. Pure, so the countdown can be tested
 * without drawing anything.
 */

/**
 * How much of a toast's life is left.
 *
 * It is what the countdown bar starts from when it is drawn: a toast that moves
 * from one place of the screen to another (the floating one hands over to the
 * one on Home when Home comes back into view) is drawn again, and its bar must
 * carry on from where it was instead of starting full.
 *
 * Postcondition: a number between 0 and 1, inclusive; 1 for a toast that has
 * just appeared (or one whose clock reads earlier than its start), 0 once its
 * time is up.
 *
 * @param shownAt Instant the toast was shown, in milliseconds.
 * @param now Current instant, in milliseconds.
 * @param lifetime How long a toast lasts, in milliseconds.
 */
export function toastRemainingShare(
  shownAt: number,
  now: number,
  lifetime: number,
) {
  if (lifetime <= 0) return 0;
  return Math.min(1, Math.max(0, 1 - (now - shownAt) / lifetime));
}
