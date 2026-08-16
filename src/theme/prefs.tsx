import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo } from 'react-native';

import { detectLanguage, type Language } from '@/lib/language';
import type { WeekStart } from '@/types';
import i18n from './i18n';
import { color } from './tokens';

export type { Language };

/** Key the preferences are stored under on the device. */
/**
 * Key the preferences are stored under. Exported because the home screen
 * widget runs outside React, with no provider above it, and still needs to
 * know where the week starts to count a weekly habit.
 */
export const PREFERENCES_KEY = 'dcalendar-preferences';

export type { WeekStart };

/**
 * The "Violeta" accent's hex before it was moved to match the app icon's own
 * accent colour (`#c4a8e0`). Anyone who had it selected is migrated to the
 * new value on the next read, so the swatch keeps showing as selected in
 * Settings › Apariencia instead of matching nothing.
 */
const OLD_VIOLET_ACCENT = '#9184d9';

export type Preferences = {
  accent: string;
  weekStart: WeekStart;
  /** Default duration of an event, in minutes. */
  defaultDuration: number;
  defaultCalendarId: string;
  /**
   * Whether reminders reach the system at all. Turning it off empties the
   * queue; it says nothing about the system permission, which is asked for
   * separately. The four settings below only matter while this is on.
   */
  notifications: boolean;
  /** Whether an event of the app's own calendars can remind. */
  notifyEvents: boolean;
  /** Whether a task can remind. */
  notifyTasks: boolean;
  /** Whether a habit can remind. */
  notifyHabits: boolean;
  /**
   * Whether an event from a calendar of the device or a subscription can
   * remind at all. Off, `deviceReminders` below never matters: nothing from
   * outside the app reminds, chosen calendar by calendar or not.
   */
  notifyForeignEvents: boolean;
  /**
   * Whether the alarms an event of the device brings with it are scheduled too.
   * Off by default: the calendar those events came from already announces them,
   * so turning it on means being told twice. It says nothing about a reminder
   * the user sets by hand on one of those events, which is always scheduled
   * while `notifyForeignEvents` is on.
   */
  deviceReminders: boolean;
  reduceMotion: boolean;
  mono: boolean;
  language: Language;
  /** Whether the first-launch onboarding has already run. */
  onboarded: boolean;
};

type PreferencesContextValue = Preferences & {
  /** true when the user asked for it in Settings or the system has it on. */
  motionOff: boolean;
  setPreference: <Key extends keyof Preferences>(
    key: Key,
    value: Preferences[Key],
  ) => void;
};

const DEFAULT_PREFERENCES: Preferences = {
  accent: color.accentDefault,
  weekStart: 'Lunes',
  defaultDuration: 30,
  defaultCalendarId: 'cal-personal',
  notifications: true,
  notifyEvents: true,
  notifyTasks: true,
  notifyHabits: true,
  notifyForeignEvents: true,
  deviceReminders: false,
  reduceMotion: false,
  mono: false,
  language: detectLanguage(),
  onboarded: false,
};

/**
 * Under the "Reducir animaciones" setting the overlay keeps a short fade
 * instead of appearing at once (handoff §3).
 */
const REDUCED_OVERLAY_MS = 100;

const PreferencesContext = createContext<PreferencesContextValue>({
  ...DEFAULT_PREFERENCES,
  motionOff: false,
  setPreference: () => {},
});

/**
 * Keeps the app preferences and combines them with the system accessibility
 * settings. They are stored on the device, so the accent, the week start and
 * the reminders switch survive closing the app.
 *
 * Nothing is drawn until they have been read: the preferences decide the accent
 * and the typeface, and starting with the defaults would repaint the whole
 * interface a moment later.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(
    DEFAULT_PREFERENCES,
  );
  const [hydrated, setHydrated] = useState(false);
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);

  /**
   * Reads what was stored, falling back to the defaults for anything missing so
   * a preference added later does not arrive as `undefined`.
   *
   * Two of those missing preferences get a real value instead of the default,
   * because the default is wrong for someone who already has a stored blob:
   * `onboarded` defaults to true, not false, since a blob with no such key can
   * only belong to an install from before onboarding existed - the wizard is
   * for someone who has never opened the app, not someone updating it. And an
   * `accent` left over from before the "Violeta" swatch changed hex is mapped
   * onto its new value, so it still matches a swatch in Settings › Apariencia.
   */
  useEffect(() => {
    let subscribed = true;

    AsyncStorage.getItem(PREFERENCES_KEY)
      .then((stored) => {
        if (!subscribed) return;
        if (stored) {
          const parsed = JSON.parse(stored);
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...parsed,
            accent:
              parsed.accent === OLD_VIOLET_ACCENT
                ? color.accentDefault
                : (parsed.accent ?? DEFAULT_PREFERENCES.accent),
            onboarded: parsed.onboarded ?? true,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (subscribed) setHydrated(true);
      });

    return () => {
      subscribed = false;
    };
  }, []);

  /**
   * Writes on every change, never before reading: otherwise the first render
   * would overwrite what is stored with the defaults.
   */
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)).catch(
      () => {},
    );
  }, [preferences, hydrated]);

  useEffect(() => {
    let subscribed = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (subscribed) setSystemReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setSystemReduceMotion,
    );
    return () => {
      subscribed = false;
      subscription.remove();
    };
  }, []);

  /**
   * Keeps `i18next` in step with the preference: on mount (the default guessed
   * from the device), and again whenever hydration overrides it or the user
   * changes it in Settings.
   */
  useEffect(() => {
    i18n.changeLanguage(preferences.language);
  }, [preferences.language]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...preferences,
      motionOff: preferences.reduceMotion || systemReduceMotion,
      setPreference: (key, next) =>
        setPreferences((current) => ({ ...current, [key]: next })),
    }),
    [preferences, systemReduceMotion],
  );

  if (!hydrated) return null;

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePrefs = () => useContext(PreferencesContext);

/** The accent, the only thing in the app that carries colour. */
export const useAccent = () => useContext(PreferencesContext).accent;

/**
 * Returns the function that translates a duration from the theme into the real
 * duration, honouring the "Reducir animaciones" setting.
 *
 * Precondition: `milliseconds` comes from `duration` (tokens); `kind` tells the
 * overlay fade apart from every other kind of movement. Postcondition: with
 * motion enabled it returns the duration untouched; with motion disabled it
 * returns 0, or `REDUCED_OVERLAY_MS` for the overlay.
 */
export function useDuration() {
  const { motionOff } = usePrefs();
  return (milliseconds: number, kind: 'motion' | 'overlay' = 'motion') => {
    if (!motionOff) return milliseconds;
    return kind === 'overlay' ? REDUCED_OVERLAY_MS : 0;
  };
}
