import {
  CALENDAR_MAX_SHARE,
  CALENDAR_MIN_SHARE,
  calendarBoxHeight,
  settledHeight,
} from './layout';

/** Room below the header on a mid-sized phone, and the gap Home leaves. */
const AVAILABLE = 600;
const GAP = 10;

describe('calendarBoxHeight', () => {
  test('is 0 while there is no room measured', () => {
    expect(calendarBoxHeight(0, 100, GAP)).toBe(0);
  });

  test('with a short list, takes what it leaves free', () => {
    expect(calendarBoxHeight(AVAILABLE, 250, GAP)).toBe(AVAILABLE - GAP - 250);
  });

  test('with an empty list, stops at the most it may take', () => {
    expect(calendarBoxHeight(AVAILABLE, 60, GAP)).toBe(
      AVAILABLE * CALENDAR_MAX_SHARE,
    );
  });

  test('with a long list, keeps the least it needs', () => {
    expect(calendarBoxHeight(AVAILABLE, 2000, GAP)).toBe(
      AVAILABLE * CALENDAR_MIN_SHARE,
    );
  });
});

describe('settledHeight', () => {
  const THRESHOLD = 24;

  test('takes the target when nothing has settled yet', () => {
    expect(settledHeight(0, 320, THRESHOLD)).toBe(320);
  });

  test('ignores a change smaller than the threshold', () => {
    expect(settledHeight(320, 330, THRESHOLD)).toBe(320);
    expect(settledHeight(320, 297, THRESHOLD)).toBe(320);
  });

  test('moves for a change at least as big as the threshold', () => {
    expect(settledHeight(320, 344, THRESHOLD)).toBe(344);
    expect(settledHeight(320, 260, THRESHOLD)).toBe(260);
  });
});
