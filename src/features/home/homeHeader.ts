import { MONTHS, formatDayTitle } from '@/lib/date';

/**
 * Texts of the Home header.
 *
 * The header says four different things depending on the state of the calendar
 * box (collapsed or expanded, in day or week mode). It is resolved in a pure
 * function so the screen does not pile up nested conditions.
 */

/** The two modes of the calendar box. */
export type CalendarMode = 'today' | 'week';

export type HomeHeaderCopy = {
  title: string;
  /** Micro label under the title: the month, the year or the visible days. */
  subtitle: string;
  /** Micro label on the right; empty while the box is expanded. */
  right: string;
  /** Label of the current mode in the control column. */
  modeLabel: string;
  /** Label of the mode a tap switches to. */
  otherModeLabel: string;
};

/** Labels of the mode control, by box state. */
const MODE_LABELS = {
  collapsed: { today: 'HOY', week: 'SEM' },
  expanded: { today: 'DÍA', week: 'MES' },
} as const;

type HomeHeaderParams = {
  mode: CalendarMode;
  expanded: boolean;
  /** Day opened from the week or month view; without it, today is described. */
  focusDay: Date | null;
  today: Date;
  todayEventCount: number;
  weekEventCount: number;
  /** How many days fit in the expanded day view. */
  visibleDayCount: number;
};

/**
 * Resolves the five header texts for one state of Home.
 *
 * Postcondition: `right` is an empty string while the box is expanded, which is
 * the state where the design hides the event counter. `modeLabel` and
 * `otherModeLabel` are never equal.
 *
 * @param params State of the calendar box and the event counts.
 */
export function homeHeaderCopy(params: HomeHeaderParams): HomeHeaderCopy {
  const {
    mode,
    expanded,
    focusDay,
    today,
    todayEventCount,
    weekEventCount,
    visibleDayCount,
  } = params;

  const monthName = MONTHS[today.getMonth()];
  const labels = expanded ? MODE_LABELS.expanded : MODE_LABELS.collapsed;
  const otherMode: CalendarMode = mode === 'today' ? 'week' : 'today';

  const title = expanded
    ? mode === 'week'
      ? monthName
      : formatDayTitle(focusDay ?? today)
    : mode === 'week'
      ? 'Esta semana'
      : formatDayTitle(today);

  const subtitle = expanded
    ? mode === 'today'
      ? `${visibleDayCount} DÍAS`
      : String(today.getFullYear())
    : monthName.toUpperCase();

  const eventCount = mode === 'today' ? todayEventCount : weekEventCount;

  return {
    title,
    subtitle,
    right: expanded ? '' : `${eventCount} EVENTOS`,
    modeLabel: labels[mode],
    otherModeLabel: labels[otherMode],
  };
}
