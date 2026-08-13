import { formatDayTitle, isoWeek, monthName } from '@/lib/date';
import type { Language } from '@/theme/prefs';

/**
 * Texts of the Home header.
 *
 * The header says four different things depending on the state of the calendar
 * box (collapsed or expanded, in day or week mode). It is resolved in a pure
 * function so the screen does not pile up nested conditions.
 *
 * Every one of them is about the day the box has been scrolled to, not about
 * today: the views travel through days now, and a header still naming today
 * while the box shows next Tuesday would be worse than no header at all.
 *
 * This module stays plain and reads no hook of its own, so it takes the
 * `translate` function `useTranslation()` returns as a parameter instead of
 * calling the hook itself, alongside the `language` its date formatting needs.
 */

/** The two modes of the calendar box. */
export type CalendarMode = 'today' | 'week';

export type HomeHeaderCopy = {
  title: string;
  /** Micro label under the title: the month, or the year in the month view. */
  subtitle: string;
  /** Micro label on the right; empty while the box is expanded. */
  right: string;
  /** Label of the current mode in the control column. */
  modeLabel: string;
  /** Label of the mode a tap switches to. */
  otherModeLabel: string;
};

type HomeHeaderParams = {
  mode: CalendarMode;
  expanded: boolean;
  /** Day the box has been scrolled to. */
  shownDay: Date;
  /** Events of `shownDay`, for the counter in day mode. */
  dayEventCount: number;
  /** Events of the week holding `shownDay`, for the counter in week mode. */
  weekEventCount: number;
  /** Whether the week holding `shownDay` also holds today. */
  isCurrentWeek: boolean;
  /** Active language, for the date names. */
  language: Language;
  /** `t` from `useTranslation()`, for the copy. */
  translate: (key: string, options?: Record<string, unknown>) => string;
};

/**
 * Resolves the five header texts for one state of Home.
 *
 * Postcondition: `right` is an empty string while the box is expanded, which is
 * the state where the design hides the event counter. `modeLabel` and
 * `otherModeLabel` are never equal.
 *
 * @param params State of the calendar box, the event counts and the copy.
 */
export function homeHeaderCopy(params: HomeHeaderParams): HomeHeaderCopy {
  const {
    mode,
    expanded,
    shownDay,
    dayEventCount,
    weekEventCount,
    isCurrentWeek,
    language,
    translate,
  } = params;

  const modeLabels = {
    collapsed: {
      today: translate('home.todayCollapsed'),
      week: translate('home.weekCollapsed'),
    },
    expanded: {
      today: translate('home.todayExpanded'),
      week: translate('home.weekExpanded'),
    },
  } as const;

  const labels = expanded ? modeLabels.expanded : modeLabels.collapsed;
  const otherMode: CalendarMode = mode === 'today' ? 'week' : 'today';

  /**
   * The month view is the one place the title is not about a single day: it
   * scrolls through whole months and names the year underneath.
   */
  const isMonthView = expanded && mode === 'week';

  const title = isMonthView
    ? monthName(shownDay.getMonth(), language)
    : mode === 'week'
      ? isCurrentWeek
        ? translate('home.thisWeek')
        : translate('home.weekNumber', { number: isoWeek(shownDay) })
      : formatDayTitle(shownDay, language);

  const subtitle = isMonthView
    ? String(shownDay.getFullYear())
    : monthName(shownDay.getMonth(), language).toUpperCase();

  const eventCount = mode === 'today' ? dayEventCount : weekEventCount;

  return {
    title,
    subtitle,
    right: expanded ? '' : translate('home.eventsCount', { count: eventCount }),
    modeLabel: labels[mode],
    otherModeLabel: labels[otherMode],
  };
}
