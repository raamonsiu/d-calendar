import type { CalEvent } from '@/types';
import { layoutDay, layoutDayColumn, splitAllDay } from './selectors';

/** A moment on the one day these tests use, so a test only says the hour. */
const at = (hour: number, minute = 0) =>
  new Date(2026, 0, 1, hour, minute).getTime();

/** Minimal event, so each test only sets what it actually varies. */
function event(fields: Partial<CalEvent> & { id: string }): CalEvent {
  return {
    title: 'Evento',
    description: '',
    location: '',
    startsAt: 0,
    endsAt: 0,
    allDay: false,
    calendarId: 'cal-1',
    availability: 'Ocupado',
    visibility: 'Predet.',
    repeat: 'No',
    weekdays: [],
    guests: [],
    reminders: [],
    ...fields,
  };
}

/** Event of the fixed test day, given as the hours it starts and ends. */
const timedEvent = (id: string, startHour: number, endHour: number) =>
  event({ id, startsAt: at(startHour), endsAt: at(endHour) });

describe('splitAllDay', () => {
  test('separa los eventos de todo el dia de los que tienen hora', () => {
    const holiday = event({ id: 'a', allDay: true });
    const meeting = event({ id: 'b', allDay: false });
    const birthday = event({ id: 'c', allDay: true });
    const lunch = event({ id: 'd', allDay: false });

    const { allDay, timed } = splitAllDay([holiday, meeting, birthday, lunch]);

    expect(allDay.map((entry) => entry.id)).toEqual(['a', 'c']);
    expect(timed.map((entry) => entry.id)).toEqual(['b', 'd']);
  });

  test('un dia vacio no pierde ni gana eventos', () => {
    expect(splitAllDay([])).toEqual({ allDay: [], timed: [] });
  });

  test('un dia sin eventos de todo el dia deja esa lista vacia', () => {
    const { allDay } = splitAllDay([event({ id: 'a', allDay: false })]);
    expect(allDay).toEqual([]);
  });
});

describe('layoutDay', () => {
  const HOUR_WIDTH = 62;

  test('un evento de una hora empieza donde su hora empieza', () => {
    const [placed] = layoutDay([timedEvent('a', 9, 10)], HOUR_WIDTH);
    expect(placed.left).toBe(9 * HOUR_WIDTH);
  });

  test('dos eventos que no se superponen comparten el carril 0', () => {
    const morning = timedEvent('a', 9, 10);
    const afternoon = timedEvent('b', 14, 15);

    const placed = layoutDay([morning, afternoon], HOUR_WIDTH);
    expect(placed.map((entry) => entry.lane)).toEqual([0, 0]);
  });

  test('dos eventos que se superponen van a carriles distintos', () => {
    const first = timedEvent('a', 9, 10);
    const overlapping = event({ id: 'b', startsAt: at(9, 30), endsAt: at(10, 30) });

    const placed = layoutDay([first, overlapping], HOUR_WIDTH);
    expect(placed[0].lane).not.toBe(placed[1].lane);
  });

  test('un evento que acaba al dia siguiente se corta al final del dia', () => {
    const overnight = event({
      id: 'a',
      startsAt: at(22),
      endsAt: new Date(2026, 0, 2, 1, 0).getTime(),
    });

    const [placed] = layoutDay([overnight], HOUR_WIDTH);
    expect(placed.width).toBe((24 - 22) * HOUR_WIDTH - 5);
  });
});

describe('layoutDayColumn', () => {
  const HOUR_HEIGHT = 60;
  const COLUMN_WIDTH = 104;
  /** Room the layout leaves between a card and the edge of the next hour. */
  const CARD_INSET = 5;

  test('dos eventos superpuestos comparten el ancho de la columna', () => {
    const first = timedEvent('a', 9, 10);
    const overlapping = event({ id: 'b', startsAt: at(9, 30), endsAt: at(10, 30) });

    const placed = layoutDayColumn([first, overlapping], HOUR_HEIGHT, COLUMN_WIDTH);
    expect(placed[0].width).toBeLessThan(COLUMN_WIDTH);
    expect(placed[1].width).toBeLessThan(COLUMN_WIDTH);
  });

  test('un evento solo en su hora ocupa la columna entera', () => {
    const [placed] = layoutDayColumn(
      [timedEvent('a', 9, 10)],
      HOUR_HEIGHT,
      COLUMN_WIDTH,
    );
    expect(placed.width).toBe(COLUMN_WIDTH - CARD_INSET);
  });
});
