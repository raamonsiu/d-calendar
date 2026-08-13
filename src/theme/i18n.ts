/**
 * The one `i18next` instance the app runs on, initialized once at import
 * time so `react-i18next`'s `useTranslation()` works with no `<Provider>`.
 *
 * The active language itself is a preference (`theme/prefs.tsx`), not state
 * this module owns: `PreferencesProvider` calls `changeLanguage` whenever it
 * changes. The domain values that stay Spanish regardless of language
 * (`Availability`, weekday names...) do not go through this instance at all -
 * see `src/data/translations/domain.ts`.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources } from '@/data/translations';

/**
 * Every namespace copy is split into. Components call `t('area.key')`, so
 * `nsSeparator` below is the dot itself: without an explicit `ns` list
 * i18next only knows the default `translation` namespace, which does not
 * exist in `resources`, and every lookup falls through to returning the raw
 * key.
 */
const NAMESPACES = [
  'common',
  'onboarding',
  'pickers',
  'settings',
  'calendars',
  'create',
  'home',
] as const;

i18n.use(initReactI18next).init({
  resources,
  ns: NAMESPACES,
  defaultNS: 'common',
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  nsSeparator: '.',
  keySeparator: false,
});

export default i18n;
