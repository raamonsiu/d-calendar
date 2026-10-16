import type { CalEvent } from '@/types';
import { expectDayLength } from './clockChange.testing';
import { dayKey } from './date';
import { eventOccurrences, expandEvents } from './occurrences';

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

/** A moment of January 2026, the month most of these tests live in. */
const at = (day: number, hour = 0, minute = 0) =>
  new Date(2026, 0, day, hour, minute).getTime();

/** The window the views reach in these tests: the whole of January 2026. */
const JANUARY = { from: at(1), to: at(31, 23, 59) };

/** The days a result falls on, which is what the calendar is asked for. */
const daysShown = (events: CalEvent[]) =>
  events.map((piece) => dayKey(new Date(piece.startsAt)));

describe('expandEvents', () => {
  test('a daily repetition reaches every day of the window', () => {
    const standup = event({
      id: 'a',
      startsAt: at(1, 9),
      endsAt: at(1, 9, 15),
      repeat: 'Cada día',
    });

    const expanded = expandEvents([standup], JANUARY.from, JANUARY.to);

    expect(expanded).toHaveLength(31);
    expect(daysShown(expanded)[0]).toBe('2026-01-01');
    expect(daysShown(expanded)[30]).toBe('2026-01-31');
  });

  test('every occurrence keeps the hour and how long it lasts', () => {
    const standup = event({
      id: 'a',
      startsAt: at(1, 9),
      endsAt: at(1, 9, 15),
      repeat: 'Cada día',
    });

    const second = expandEvents([standup], JANUARY.from, JANUARY.to)[1];

    expect(second.startsAt).toBe(at(2, 9));
    expect(second.endsAt).toBe(at(2, 9, 15));
  });

  test('every occurrence carries the id of the event it came from', () => {
    const standup = event({
      id: 'a',
      startsAt: at(1, 9),
      endsAt: at(1, 10),
      repeat: 'Cada día',
    });

    const expanded = expandEvents([standup], JANUARY.from, JANUARY.to);

    expect(expanded.every((piece) => piece.id === 'a')).toBe(true);
  });

  test('a repetition by weekday only lands on the days chosen', () => {
    const gym = event({
      id: 'a',
      startsAt: at(1, 19),
      endsAt: at(1, 20),
      repeat: 'Días de la semana',
      weekdays: [1, 3],
    });

    const expanded = expandEvents([gym], JANUARY.from, at(14, 23, 59));

    expect(daysShown(expanded)).toEqual([
      '2026-01-05',
      '2026-01-07',
      '2026-01-12',
      '2026-01-14',
    ]);
  });

  test('a monthly repetition lands on the same day number', () => {
    const rent = event({
      id: 'a',
      startsAt: at(5, 10),
      endsAt: at(5, 11),
      repeat: 'Cada mes',
    });

    const expanded = expandEvents([rent], JANUARY.from, at(31, 23, 59));
    const untilMarch = expandEvents(
      [rent],
      JANUARY.from,
      new Date(2026, 2, 31, 23, 59).getTime(),
    );

    expect(daysShown(expanded)).toEqual(['2026-01-05']);
    expect(daysShown(untilMarch)).toEqual([
      '2026-01-05',
      '2026-02-05',
      '2026-03-05',
    ]);
  });

  test('a repetition does not reach back before the day it was created', () => {
    const standup = event({
      id: 'a',
      startsAt: at(20, 9),
      endsAt: at(20, 9, 30),
      repeat: 'Cada día',
    });

    const expanded = expandEvents([standup], JANUARY.from, JANUARY.to);

    expect(daysShown(expanded)[0]).toBe('2026-01-20');
    expect(expanded).toHaveLength(12);
  });

  test('an event of a single day comes back untouched, and not as a copy', () => {
    const lunch = event({ id: 'a', startsAt: at(8, 13), endsAt: at(8, 14) });

    const expanded = expandEvents([lunch], JANUARY.from, JANUARY.to);

    expect(expanded).toHaveLength(1);
    expect(expanded[0]).toBe(lunch);
  });

  test('a night that runs past midnight is on both days, cut at midnight', () => {
    const shift = event({ id: 'a', startsAt: at(8, 22), endsAt: at(9, 2) });

    const expanded = expandEvents([shift], JANUARY.from, JANUARY.to);

    expect(daysShown(expanded)).toEqual(['2026-01-08', '2026-01-09']);
    expect(expanded[0].startsAt).toBe(at(8, 22));
    expect(expanded[0].endsAt).toBe(at(9));
    expect(expanded[1].startsAt).toBe(at(9));
    expect(expanded[1].endsAt).toBe(at(9, 2));
  });

  test('a trip is on each of its days, and the ones in between are whole', () => {
    const trip = event({
      id: 'a',
      allDay: true,
      startsAt: at(10),
      endsAt: at(13),
    });

    const expanded = expandEvents([trip], JANUARY.from, JANUARY.to);

    expect(daysShown(expanded)).toEqual([
      '2026-01-10',
      '2026-01-11',
      '2026-01-12',
    ]);
    expect(expanded[1].startsAt).toBe(at(11));
    expect(expanded[1].endsAt).toBe(at(12));
    expect(expanded.every((piece) => piece.allDay)).toBe(true);
  });

  test('a day with no hour stored as ending at midnight stays one day', () => {
    const holiday = event({
      id: 'a',
      allDay: true,
      startsAt: at(6),
      endsAt: at(7),
    });

    const expanded = expandEvents([holiday], JANUARY.from, JANUARY.to);

    expect(daysShown(expanded)).toEqual(['2026-01-06']);
  });

  test('an event ending at midnight of its own day stays on that day', () => {
    const lateShift = event({ id: 'a', startsAt: at(6, 20), endsAt: at(7) });

    const expanded = expandEvents([lateShift], JANUARY.from, JANUARY.to);

    expect(daysShown(expanded)).toEqual(['2026-01-06']);
  });

  test('an event whose end arrived broken is still drawn once', () => {
    const broken = event({ id: 'a', startsAt: at(6, 20), endsAt: at(4) });

    const expanded = expandEvents([broken], JANUARY.from, JANUARY.to);

    expect(daysShown(expanded)).toEqual(['2026-01-06']);
  });

  test('an event running for years is cut at a year of days', () => {
    const broken = event({
      id: 'a',
      startsAt: at(1),
      endsAt: new Date(2031, 0, 1).getTime(),
    });

    const expanded = expandEvents(
      [broken],
      JANUARY.from,
      new Date(2031, 0, 1).getTime(),
    );

    expect(expanded).toHaveLength(366);
  });

  test('an event that started before the window keeps the days inside it', () => {
    const conference = event({
      id: 'a',
      allDay: true,
      startsAt: new Date(2025, 11, 30).getTime(),
      endsAt: at(2),
    });

    const expanded = expandEvents([conference], JANUARY.from, JANUARY.to);

    expect(daysShown(expanded)).toEqual(['2026-01-01']);
  });

  test('an event running past the end of the window keeps the days inside it', () => {
    const conference = event({
      id: 'a',
      allDay: true,
      startsAt: at(30),
      endsAt: new Date(2026, 1, 3).getTime(),
    });

    const expanded = expandEvents([conference], JANUARY.from, JANUARY.to);

    expect(daysShown(expanded)).toEqual(['2026-01-30', '2026-01-31']);
  });

  test('a repetition that started before the window is picked up inside it', () => {
    const standup = event({
      id: 'a',
      startsAt: new Date(2025, 10, 3, 9, 0).getTime(),
      endsAt: new Date(2025, 10, 3, 9, 30).getTime(),
      repeat: 'Cada día',
    });

    const expanded = expandEvents([standup], at(5), at(7, 23, 59));

    expect(daysShown(expanded)).toEqual(['2026-01-05', '2026-01-06', '2026-01-07']);
  });

  test('an event of two days repeating every day still draws each day once', () => {
    const shift = event({
      id: 'a',
      startsAt: at(1, 22),
      endsAt: at(3, 2),
      repeat: 'Cada día',
    });

    const expanded = expandEvents([shift], JANUARY.from, at(5, 23, 59));

    expect(daysShown(expanded)).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
      '2026-01-05',
    ]);
  });

  test('an event outside the window is left out', () => {
    const march = event({
      id: 'a',
      startsAt: new Date(2026, 2, 3, 9, 0).getTime(),
      endsAt: new Date(2026, 2, 3, 10, 0).getTime(),
    });

    expect(expandEvents([march], JANUARY.from, JANUARY.to)).toEqual([]);
  });

  test('keeps the order of the input, each event with its days together', () => {
    const trip = event({ id: 'a', allDay: true, startsAt: at(10), endsAt: at(12) });
    const lunch = event({ id: 'b', startsAt: at(9, 13), endsAt: at(9, 14) });

    const expanded = expandEvents([trip, lunch], JANUARY.from, JANUARY.to);

    expect(expanded.map((piece) => piece.id)).toEqual(['a', 'a', 'b']);
  });

  test('an empty list expands to nothing', () => {
    expect(expandEvents([], JANUARY.from, JANUARY.to)).toEqual([]);
  });

  test('on the 25-hour clock-change day, the night is still cut at midnight', () => {
    expectDayLength(new Date(2026, 9, 25), 25);

    const shift = event({
      id: 'a',
      startsAt: new Date(2026, 9, 25, 22, 0).getTime(),
      endsAt: new Date(2026, 9, 26, 2, 0).getTime(),
    });

    const expanded = expandEvents(
      [shift],
      new Date(2026, 9, 1).getTime(),
      new Date(2026, 9, 31, 23, 59).getTime(),
    );

    expect(expanded[0].endsAt).toBe(new Date(2026, 9, 26).getTime());
    expect(expanded[1].startsAt).toBe(new Date(2026, 9, 26).getTime());
  });

  test('on the 23-hour clock-change day, a whole day still runs midnight to midnight', () => {
    expectDayLength(new Date(2027, 2, 28), 23);

    const trip = event({
      id: 'a',
      allDay: true,
      startsAt: new Date(2027, 2, 27).getTime(),
      endsAt: new Date(2027, 2, 30).getTime(),
    });

    const expanded = expandEvents(
      [trip],
      new Date(2027, 2, 1).getTime(),
      new Date(2027, 2, 31, 23, 59).getTime(),
    );

    expect(expanded[1].startsAt).toBe(new Date(2027, 2, 28).getTime());
    expect(expanded[1].endsAt).toBe(new Date(2027, 2, 29).getTime());
  });
});

describe('eventOccurrences', () => {
  test('an event that does not repeat answers with its own start', () => {
    const lunch = event({ id: 'a', startsAt: at(8, 13), endsAt: at(8, 14) });

    expect(eventOccurrences(lunch, JANUARY.from, JANUARY.to)).toEqual([
      at(8, 13),
    ]);
  });

  test('an event that does not repeat and falls outside answers with nothing', () => {
    const lunch = event({ id: 'a', startsAt: at(8, 13), endsAt: at(8, 14) });

    expect(eventOccurrences(lunch, at(9), JANUARY.to)).toEqual([]);
  });

  test('a weekly repetition with no weekday chosen falls on the first one', () => {
    const gym = event({
      id: 'a',
      startsAt: at(1, 19),
      endsAt: at(1, 20),
      repeat: 'Días de la semana',
    });

    const occurrences = eventOccurrences(gym, JANUARY.from, at(15, 23, 59));

    expect(occurrences.map((instant) => new Date(instant).getDate())).toEqual([
      1, 8, 15,
    ]);
  });
});
