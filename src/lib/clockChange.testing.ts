/**
 * Helper for the tests about the two days a year the clock changes, when a day
 * lasts 23 or 25 hours in Europe/Madrid, the zone `jest.globalSetup.js` pins
 * the test workers to. Only tests import it; the app never does.
 */

/** One hour, to state how long a day is. */
const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * Asserts that a day really lasts the given number of hours, so a test about a
 * clock-change day fails, instead of passing for nothing, when the time zone
 * pin did not take effect: in a zone without daylight saving every day is 24
 * hours long.
 *
 * Precondition: called inside a Jest test.
 * Postcondition: fails the test when the day lasts any other number of hours.
 *
 * @param day Any moment of the day being checked.
 * @param hours How long that day must be: 23 or 25 for the clock-change days.
 */
export function expectDayLength(day: Date, hours: number) {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  expect(next.getTime() - start.getTime()).toBe(hours * MS_PER_HOUR);
}
