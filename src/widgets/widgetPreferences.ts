/**
 * The two preferences the widget needs, read from outside React.
 *
 * `usePrefs` is a hook over a context, and the widget has neither, so these
 * go to the stored blob directly. They fall back to the same defaults the app
 * starts with, so a widget added before the app was ever opened still draws.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HexColor } from 'react-native-android-widget';

import { detectLanguage, type Language } from '@/lib/language';
import { PREFERENCES_KEY } from '@/theme/prefs';
import { color } from '@/theme/tokens';

/**
 * Narrows a stored colour to the shape Android can parse in a widget.
 *
 * The accent reaches here as whatever was in the stored preferences, and the
 * widget hands its colours straight to the platform, which throws on anything
 * that is not a hex. Postcondition: returns the app default rather than
 * letting an unusable value through.
 *
 * @param value Colour as it was read from storage.
 */
export function asHexColor(value: unknown): HexColor {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
    ? (value as HexColor)
    : (color.accentDefault as HexColor);
}

/** Languages the widget has copy for; anything else falls back to English. */
const SUPPORTED: Language[] = ['es', 'en', 'ca'];

/** The stored preferences, or null when there are none to read. */
async function storedPreferences(): Promise<Record<string, unknown> | null> {
  try {
    const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Language the widget writes its own copy in.
 *
 * Postcondition: falls back to the device's own guess when nothing is stored,
 * which is what the app itself would have chosen on first launch.
 */
export async function readLanguage(): Promise<Language> {
  const preferences = await storedPreferences();
  const stored = preferences?.language;
  return SUPPORTED.includes(stored as Language)
    ? (stored as Language)
    : detectLanguage();
}

/** Accent the user chose, or the app's default when there is none stored. */
export async function readAccent(): Promise<HexColor> {
  const preferences = await storedPreferences();
  return asHexColor(preferences?.accent);
}
