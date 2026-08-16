/**
 * Keeps the home screen widgets in step with the app.
 *
 * Android refreshes a widget on its own at most every 30 minutes, which is
 * far too slow for a habit ticked off inside the app: the user would go back
 * to the home screen and still see the old count. So every change to the
 * habits pushes a redraw.
 *
 * Mounted once, next to the other background jobs in `src/app/_layout.tsx`.
 * It draws nothing itself; it lives in `src/widgets` and not in `src/services`
 * because everything it touches belongs to the widget.
 */
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { useAppStore } from '@/store/useAppStore';
import { usePrefs } from '@/theme/prefs';
import { HabitWidget, NoHabitsWidget, UnassignedWidget } from './HabitWidget';
import { WIDGET_COPY } from './widgetCopy';
import { readWidgetHabit } from './widgetData';
import { asHexColor } from './widgetPreferences';

/**
 * Wait before redrawing, so counting three repetitions in a row redraws once
 * instead of three times.
 */
const REDRAW_DEBOUNCE_MS = 400;

export function useWidgetSync() {
  const { language, accent: storedAccent } = usePrefs();
  const accent = asHexColor(storedAccent);
  const redrawTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    let active = true;

    const redraw = () => {
      requestWidgetUpdate({
        widgetName: 'Habit',
        renderWidget: async ({ widgetId }) => {
          const habit = await readWidgetHabit(widgetId);
          if (habit) {
            return (
              <HabitWidget habit={habit} accent={accent} language={language} />
            );
          }

          const anyHabits = useAppStore.getState().habits.length > 0;
          return anyHabits ? (
            <UnassignedWidget text={WIDGET_COPY[language].pickAHabit} />
          ) : (
            <NoHabitsWidget accent={accent} />
          );
        },
      }).catch(() => {});
    };

    const scheduleRedraw = () => {
      if (redrawTimer.current) clearTimeout(redrawTimer.current);
      redrawTimer.current = setTimeout(() => {
        if (active) redraw();
      }, REDRAW_DEBOUNCE_MS);
    };

    /**
     * Only a change in the habits matters here: everything else the store
     * holds is invisible from the home screen.
     */
    let previousHabits = useAppStore.getState().habits;
    const unsubscribe = useAppStore.subscribe((state) => {
      if (state.habits === previousHabits) return;
      previousHabits = state.habits;
      scheduleRedraw();
    });

    redraw();

    return () => {
      active = false;
      if (redrawTimer.current) clearTimeout(redrawTimer.current);
      unsubscribe();
    };
  }, [accent, language]);
}
