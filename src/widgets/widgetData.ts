/**
 * What the home screen widget needs from the app, read from outside React.
 *
 * The widget is drawn by a headless task: there is no provider above it, no
 * `usePrefs`, and often no running app at all. What there is, is the same
 * AsyncStorage the app persists into, so everything here goes through the
 * store's own rehydration rather than parsing the stored JSON by hand. That
 * is what lets the widget reuse the real domain rules - the period rollover,
 * the streak - instead of a second copy of them that could drift.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ClockTime } from '@/lib/date';
import { dayEndClock, rolledOverHabit } from '@/lib/habits';
import { useAppStore } from '@/store/useAppStore';
import { PREFERENCES_KEY } from '@/theme/prefs';
import type { Habit, WeekStart } from '@/types';

/** Where the widget remembers which habit each of its instances tracks. */
const WIDGET_LINKS_KEY = 'dcalendar-widget-habits';

/** Used when the stored preferences cannot be read; matches the app default. */
const FALLBACK_WEEK_START: WeekStart = 'Lunes';

/** Habit ids the widgets track, by the widget id Android assigns. */
type WidgetLinks = Record<string, string>;

/** The two preference fields the widget reads, exactly as they are stored. */
type StoredPreferences = { weekStart?: WeekStart; dayEndTime?: string };

/**
 * The preferences blob, read and parsed once so `readHabits` and
 * `bumpHabitFromWidget` do not each read and parse the same AsyncStorage entry
 * a second time for the day-end after already reading it for the week start.
 *
 * Postcondition: an empty object when nothing is stored or the blob cannot be
 * parsed, which leaves every field below to fall back to its own default.
 */
async function readPreferences(): Promise<StoredPreferences> {
  try {
    const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

const weekStartOf = (preferences: StoredPreferences): WeekStart =>
  preferences.weekStart ?? FALLBACK_WEEK_START;

const dayEndOf = (preferences: StoredPreferences): ClockTime =>
  dayEndClock(preferences.dayEndTime);

/**
 * The week start the user chose, read straight from storage.
 *
 * Postcondition: falls back to Monday when nothing is stored or the blob
 * cannot be parsed, which is what a fresh install would have anyway.
 */
export async function readWeekStart(): Promise<WeekStart> {
  return weekStartOf(await readPreferences());
}

/**
 * The day-end the user chose, read straight from storage.
 *
 * Postcondition: falls back to midnight when nothing is stored, the blob
 * cannot be parsed, or the stored text is not a time of day.
 */
export async function readDayEnd(): Promise<ClockTime> {
  return dayEndOf(await readPreferences());
}

/**
 * Brings the store up to what is on disk before reading it.
 *
 * The headless task may run with the app closed, in which case the store is
 * still holding its seed. Rehydrating first is what makes the widget show the
 * user's habits and not the placeholder ones.
 */
async function hydratedStore() {
  await useAppStore.persist.rehydrate();
  return useAppStore.getState();
}

/** Every habit, already brought into the period being looked at. */
export async function readHabits(): Promise<Habit[]> {
  const [state, preferences] = await Promise.all([
    hydratedStore(),
    readPreferences(),
  ]);
  const weekStart = weekStartOf(preferences);
  const dayEnd = dayEndOf(preferences);
  return state.habits.map((habit) => rolledOverHabit(habit, weekStart, dayEnd));
}

/**
 * The habit one widget tracks, as it stands in the current period.
 *
 * Postcondition: null when the widget has not been configured yet, and also
 * when the habit it pointed at has since been deleted - the two are the same
 * thing from the widget's side, and both are answered by asking again.
 *
 * @param widgetId Id Android gave this instance of the widget.
 */
export async function readWidgetHabit(widgetId: number): Promise<Habit | null> {
  const [habits, links] = await Promise.all([readHabits(), readWidgetLinks()]);
  const habitId = links[String(widgetId)];
  if (!habitId) return null;
  return habits.find((habit) => habit.id === habitId) ?? null;
}

/** The whole widget-to-habit map, or an empty one when there is none. */
export async function readWidgetLinks(): Promise<WidgetLinks> {
  try {
    const stored = await AsyncStorage.getItem(WIDGET_LINKS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Points a widget at a habit, keeping the other widgets' choices.
 *
 * @param widgetId Id Android gave this instance of the widget.
 * @param habitId Habit the user picked in the configuration screen.
 */
export async function linkWidgetToHabit(widgetId: number, habitId: string) {
  const links = await readWidgetLinks();
  const next = { ...links, [String(widgetId)]: habitId };
  await AsyncStorage.setItem(WIDGET_LINKS_KEY, JSON.stringify(next));
}

/**
 * Forgets a widget that was removed from the home screen, so the map does not
 * grow with ids Android will never use again.
 *
 * @param widgetId Id of the widget being removed.
 */
export async function unlinkWidget(widgetId: number) {
  const links = await readWidgetLinks();
  if (!(String(widgetId) in links)) return;

  const next = { ...links };
  delete next[String(widgetId)];
  await AsyncStorage.setItem(WIDGET_LINKS_KEY, JSON.stringify(next));
}

/**
 * Adds one repetition to a habit and answers with how it stands afterwards.
 *
 * It goes through the store's own `bumpHabit`, so a tap on the widget counts
 * exactly like a tap on the card: same period rollover, same streak rule, and
 * the same single write the app makes.
 *
 * Postcondition: null when the habit no longer exists, which is what a widget
 * left pointing at a deleted habit gets.
 *
 * @param habitId Habit the widget tracks.
 */
export async function bumpHabitFromWidget(
  habitId: string,
): Promise<Habit | null> {
  const [state, preferences] = await Promise.all([
    hydratedStore(),
    readPreferences(),
  ]);
  const weekStart = weekStartOf(preferences);
  const dayEnd = dayEndOf(preferences);

  if (!state.habits.some((habit) => habit.id === habitId)) return null;

  state.bumpHabit(habitId, 1, weekStart, dayEnd);

  const bumped = useAppStore
    .getState()
    .habits.find((habit) => habit.id === habitId);

  return bumped ? rolledOverHabit(bumped, weekStart, dayEnd) : null;
}
