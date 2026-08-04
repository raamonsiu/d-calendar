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

export type WeekStart = 'Lunes' | 'Sábado' | 'Domingo';

export type Prefs = {
  accent: string;
  weekStart: WeekStart;
  /** Duración por defecto de un evento, en minutos. */
  defaultDuration: number;
  defaultCalendarId: string;
  reduceMotion: boolean;
  mono: boolean;
};

type PrefsContextValue = Prefs & {
  /** true si el usuario lo pidió en Ajustes o si el sistema lo tiene activado. */
  motionOff: boolean;
  set: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
};

const DEFAULTS: Prefs = {
  accent: color.accentDefault,
  weekStart: 'Lunes',
  defaultDuration: 30,
  defaultCalendarId: 'cal-personal',
  reduceMotion: false,
  mono: false,
};

const PrefsContext = createContext<PrefsContextValue>({
  ...DEFAULTS,
  motionOff: false,
  set: () => {},
});

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setSystemReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setSystemReduceMotion,
    );
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  const value = useMemo<PrefsContextValue>(
    () => ({
      ...prefs,
      motionOff: prefs.reduceMotion || systemReduceMotion,
      set: (key, v) => setPrefs((p) => ({ ...p, [key]: v })),
    }),
    [prefs, systemReduceMotion],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export const usePrefs = () => useContext(PrefsContext);

/** El acento, que es lo único que va en color. */
export const useAccent = () => useContext(PrefsContext).accent;

/**
 * Duración de animación respetando «Reducir animaciones».
 * El overlay conserva un fade corto en lugar de saltar de golpe (handoff §3).
 */
export function useDuration() {
  const { motionOff } = usePrefs();
  return (ms: number, kind: 'motion' | 'overlay' = 'motion') => {
    if (!motionOff) return ms;
    return kind === 'overlay' ? 100 : 0;
  };
}
