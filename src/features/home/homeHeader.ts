import { formatDayTitle, isoWeek, monthName } from '@/lib/date';
import type { Language } from '@/theme/prefs';
import type { CalendarView } from '@/types';

/**
 * Texts of the Home header.
 *
 * The header says something different for each view of the calendar box. It
 * is resolved in a pure function so the screen does not pile up nested
 * conditions.
 *
 * Every one of them is about the day the box has been scrolled to, not about
 * today: the views travel through days, and a header still naming today while
 * the box shows next Tuesday would be worse than no header at all.
 *
 * This module stays plain and reads no hook of its own, so it takes the
 * `translate` function `useTranslation()` returns as a parameter instead of
 * calling the hook itself, alongside the `language` its date formatting needs.
 */

export type HomeHeaderCopy = {
  title: string;
  /** Micro label next to the title: the month, or the year in the month view. */
  subtitle: string;
  /** Micro label on the right, the event counter; empty in the month view. */
  right: string;
};

type HomeHeaderParams = {
  view: CalendarView;
  /** Day the box has been scrolled to. */
  shownDay: Date;
  /** Events of `shownDay`, for the counter in the day view. */
  dayEventCount: number;
  /** Events of the week holding `shownDay`, for the counter in the week view. */
  weekEventCount: number;
  /** Whether the week holding `shownDay` also holds today. */
  isCurrentWeek: boolean;
  /** Active language, for the date names. */
  language: Language;
  /** `t` from `useTranslation()`, for the copy. */
  translate: (key: string, options?: Record<string, unknown>) => string;
};

/**
 * Resolves the header texts for one view of Home.
 *
 * Postcondition: `right` is an empty string in the month view, the one view
 * whose title is not about a single day or week and which already counts its
 * events with a dot under every day.
 *
 * @param params View of the calendar box, the event counts and the copy.
 */
export function homeHeaderCopy(params: HomeHeaderParams): HomeHeaderCopy {
  const {
    view,
    shownDay,
    dayEventCount,
    weekEventCount,
    isCurrentWeek,
    language,
    translate,
  } = params;

  if (view === 'Mes') {
    return {
      title: monthName(shownDay.getMonth(), language),
      subtitle: String(shownDay.getFullYear()),
      right: '',
    };
  }

  const subtitle = monthName(shownDay.getMonth(), language).toUpperCase();

  if (view === 'Semana') {
    return {
      title: isCurrentWeek
        ? translate('home.thisWeek')
        : translate('home.weekNumber', { number: isoWeek(shownDay) }),
      subtitle,
      right: translate('home.eventsCount', { count: weekEventCount }),
    };
  }

  return {
    title: formatDayTitle(shownDay, language),
    subtitle,
    right: translate('home.eventsCount', { count: dayEventCount }),
  };
}
