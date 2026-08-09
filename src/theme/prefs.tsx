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

import { color } from './tokens';

/** Key the preferences are stored under on the device. */
const PREFERENCES_KEY = 'dcalendar-preferences';

export type WeekStart = 'Lunes' | 'Sábado' | 'Domingo';

export type Preferences = {
  accent: string;
  weekStart: WeekStart;
  /** Default duration of an event, in minutes. */
  defaultDuration: number;
  defaultCalendarId: string;
  /**
   * Whether reminders reach the system. Turning it off empties the queue; it
   * says nothing about the system permission, which is asked for separately.
   */
  notifications: boolean;
  reduceMotion: boolean;
  mono: boolean;
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
  reduceMotion: false,
  mono: false,
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
   */
  useEffect(() => {
    let subscribed = true;

    AsyncStorage.getItem(PREFERENCES_KEY)
      .then((stored) => {
        if (!subscribed) return;
        if (stored) {
          setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
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
