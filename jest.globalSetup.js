/**
 * Jest global setup: pins the time zone every test worker runs in.
 *
 * Several tests cover the two days a year the clock changes, when a day lasts
 * 23 or 25 hours. In a zone with no daylight saving, like the UTC most CI
 * machines run in, those days are 24 hours long and the tests would pass
 * whether or not the code handles the change. Europe/Madrid is the zone the
 * dates in those tests were picked for, and they assert the length of the day
 * first, so a run where this did not take effect fails instead of passing.
 */
module.exports = () => {
  process.env.TZ = 'Europe/Madrid';
};
