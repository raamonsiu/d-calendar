import { formatDayTitle, monthName } from '@/lib/date';
import { homeHeaderCopy } from './homeHeader';

/** Tuesday 13 October 2026, in week 42. */
const SHOWN_DAY = new Date(2026, 9, 13);

/** Stand-in for `t`: the key and its options, so a test can tell them apart. */
const translate = (key: string, options?: Record<string, unknown>) =>
  options ? `${key} ${JSON.stringify(options)}` : key;

/** Header params with what each test varies on top. */
function params(
  fields: Partial<Parameters<typeof homeHeaderCopy>[0]> = {},
): Parameters<typeof homeHeaderCopy>[0] {
  return {
    view: 'Día',
    shownDay: SHOWN_DAY,
    dayEventCount: 2,
    weekEventCount: 9,
    isCurrentWeek: true,
    language: 'es',
    translate,
    ...fields,
  };
}

describe('homeHeaderCopy', () => {
  test('the day view names the day and counts its events', () => {
    const copy = homeHeaderCopy(params());
    expect(copy.title).toBe(formatDayTitle(SHOWN_DAY, 'es'));
    expect(copy.subtitle).toBe(monthName(9, 'es').toUpperCase());
    expect(copy.right).toBe('home.eventsCount {"count":2}');
  });

  test('the week view says "this week" for the current one and counts the week', () => {
    const copy = homeHeaderCopy(params({ view: 'Semana' }));
    expect(copy.title).toBe('home.thisWeek');
    expect(copy.right).toBe('home.eventsCount {"count":9}');
  });

  test('the week view names any other week by its number', () => {
    const copy = homeHeaderCopy(params({ view: 'Semana', isCurrentWeek: false }));
    expect(copy.title).toBe('home.weekNumber {"number":42}');
  });

  test('the month view names the month and the year, with no counter', () => {
    const copy = homeHeaderCopy(params({ view: 'Mes' }));
    expect(copy.title).toBe(monthName(9, 'es'));
    expect(copy.subtitle).toBe('2026');
    expect(copy.right).toBe('');
  });
});
