import { expectDayLength } from './clockChange.testing';
import { startOfNextDay } from './date';

describe('startOfNextDay', () => {
  test('lands on midnight of the following day from any moment of the day', () => {
    expect(startOfNextDay(new Date(2026, 0, 15, 17, 45))).toEqual(
      new Date(2026, 0, 16),
    );
    expect(startOfNextDay(new Date(2026, 0, 15))).toEqual(new Date(2026, 0, 16));
  });

  test('rolls over the end of a month and of a year', () => {
    expect(startOfNextDay(new Date(2026, 0, 31, 9))).toEqual(
      new Date(2026, 1, 1),
    );
    expect(startOfNextDay(new Date(2026, 11, 31, 23, 59))).toEqual(
      new Date(2027, 0, 1),
    );
  });

  test('is a calendar day later, not 24 hours, on the 25-hour day', () => {
    expectDayLength(new Date(2026, 9, 25), 25);

    expect(startOfNextDay(new Date(2026, 9, 25, 12))).toEqual(
      new Date(2026, 9, 26),
    );
  });

  test('is a calendar day later, not 24 hours, on the 23-hour day', () => {
    expectDayLength(new Date(2027, 2, 28), 23);

    expect(startOfNextDay(new Date(2027, 2, 28, 12))).toEqual(
      new Date(2027, 2, 29),
    );
  });
});
