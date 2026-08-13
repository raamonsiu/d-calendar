import { calendars } from './calendars';
import { common } from './common';
import { create } from './create';
import { home } from './home';
import { onboarding } from './onboarding';
import { pickers } from './pickers';
import { settings } from './settings';

/**
 * Assembles the resources `i18next` is initialized with: one object per
 * language, one namespace per screen area plus `common`. `src/theme/i18n.ts`
 * is the only consumer - components read through `useTranslation()`.
 */
export const resources = {
  es: {
    common: common.es,
    onboarding: onboarding.es,
    pickers: pickers.es,
    settings: settings.es,
    calendars: calendars.es,
    create: create.es,
    home: home.es,
  },
  en: {
    common: common.en,
    onboarding: onboarding.en,
    pickers: pickers.en,
    settings: settings.en,
    calendars: calendars.en,
    create: create.en,
    home: home.en,
  },
  ca: {
    common: common.ca,
    onboarding: onboarding.ca,
    pickers: pickers.ca,
    settings: settings.ca,
    calendars: calendars.ca,
    create: create.ca,
    home: home.ca,
  },
};
