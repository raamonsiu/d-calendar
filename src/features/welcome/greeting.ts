import type { Language } from '@/theme/prefs';

/** Part of the day a greeting is chosen for. */
export type GreetingPeriod = 'morning' | 'afternoon' | 'night';

/** Hour the morning starts at; before it, it is still the night before. */
const MORNING_FROM = 6;

/**
 * Hour the afternoon starts at, per language. Spanish and Catalan keep their
 * morning greeting until lunch, which comes later than the English noon.
 */
const AFTERNOON_FROM: Record<Language, number> = { es: 14, ca: 14, en: 12 };

/**
 * Hour the night greeting takes over, per language: English says "good
 * evening" from the end of the working day, Spanish and Catalan wait for dark.
 */
const NIGHT_FROM: Record<Language, number> = { es: 21, ca: 21, en: 18 };

/**
 * Which greeting fits an hour of the day in a language.
 *
 * Precondition: `hour` is a whole hour from 0 to 23.
 * Postcondition: every hour maps to exactly one period; the hours after
 * midnight and before `MORNING_FROM` count as night.
 *
 * @param hour Local hour the app was opened at.
 * @param language Active language, since each one draws the lines elsewhere.
 */
export function greetingPeriod(
  hour: number,
  language: Language,
): GreetingPeriod {
  if (hour < MORNING_FROM || hour >= NIGHT_FROM[language]) return 'night';
  if (hour < AFTERNOON_FROM[language]) return 'morning';
  return 'afternoon';
}
