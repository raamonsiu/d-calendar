/**
 * Language detection. Pure and provider-free on purpose: `store/seed.ts`
 * needs the same "language at install" guess `theme/prefs.tsx` uses for the
 * `language` preference, and the store must not reach into a module that
 * carries React context, `AsyncStorage` and the rest of the preferences
 * machinery just for that.
 */
import * as Localization from 'expo-localization';

/** Supported UI languages. More will join this list; none has left it yet. */
export type Language = 'es' | 'en' | 'ca';

/**
 * Priority the app checks the device's languages against, not the order the
 * device itself lists them in: Catalan and Spanish are the app's original
 * markets, so either wins over whatever else the device carries.
 */
const LANGUAGE_PRIORITY: Language[] = ['ca', 'es', 'en'];

/**
 * Best language to start in, guessed from the device's own language list.
 *
 * Also what a fresh install's seed tasks and habits are written in
 * (`store/seed.ts`): both need the same "language at first launch" guess, and
 * only one of them should decide what it is.
 *
 * Postcondition: returns the highest-priority language
 * (`LANGUAGE_PRIORITY`) present anywhere in the device's list, or `'en'`
 * when none of them is.
 */
export function detectLanguage(): Language {
  const deviceLanguages = new Set(
    Localization.getLocales().map((locale) => locale.languageCode),
  );
  const detected = LANGUAGE_PRIORITY.find((language) =>
    deviceLanguages.has(language),
  );
  return detected ?? 'en';
}
