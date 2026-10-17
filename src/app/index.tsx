/**
 * Main screen (route `/`).
 *
 * The only root screen of the app: it brings together the calendar box, the
 * list of tasks and habits, and the create button.
 *
 * How you get here: it is the initial route. Secondary screens come back here
 * with the back arrow, and it is also the fallback destination when someone
 * opens an item detail through a deep link and there is no history to go back
 * to.
 *
 * Where it leads:
 * - `/create` with the CREAR button.
 * - `/item/[id]` when tapping a calendar event or the settings icon of a task
 *   or a habit.
 * - `/settings`, `/help` and `/about` from the side menu.
 *
 * The calendar box has three views - day, week and month - picked with the
 * selector at its top left and remembered across launches. All three travel
 * through days, and the one they are showing is kept here: switching between
 * them keeps the day, and tapping a day in the week or month view opens it in
 * the day view.
 */
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddSourceSheet } from '@/features/calendars/AddSourceSheet';
import { AgendaList } from '@/features/home/AgendaList';
import { DayView } from '@/features/home/DayView';
import { MonthExpanded } from '@/features/home/MonthExpanded';
import { SideDrawer } from '@/features/home/SideDrawer';
import { WeekStrip } from '@/features/home/WeekStrip';
import { homeHeaderCopy } from '@/features/home/homeHeader';
import { dayKey, isSameDay, startOfDay, weekDays } from '@/lib/date';
import { dayEndClock, rolledOverHabits } from '@/lib/habits';
import { eventCountsByDay, eventsByDay, tasksForHome } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { useShownEvents } from '@/store/useShownEvents';
import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { color, layer, radius, size, space } from '@/theme/tokens';
import type { CalendarView } from '@/types';
import { Tabs } from '@/ui/Tabs';
import { Cta, IconButton } from '@/ui/controls';
import { ListIcon, PlusIcon } from '@/ui/icons';

/** The three views of the calendar box, in the order the selector shows them. */
const CALENDAR_VIEWS: { value: CalendarView; labelKey: string }[] = [
  { value: 'Día', labelKey: 'home.viewDay' },
  { value: 'Semana', labelKey: 'home.viewWeek' },
  { value: 'Mes', labelKey: 'home.viewMonth' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { weekStart, dayEndTime, language, calendarView, setPreference } =
    usePrefs();
  const accent = useAccent();
  const dayEnd = useMemo(() => dayEndClock(dayEndTime), [dayEndTime]);

  const setCalendarView = (next: CalendarView) =>
    setPreference('calendarView', next);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addSourceOpen, setAddSourceOpen] = useState(false);

  /**
   * The day the calendar box is on. The three views report it as they scroll
   * and read it when they mount, which is what makes switching view keep the
   * day instead of jumping back to today.
   */
  const [shownDay, setShownDay] = useState(() => startOfDay(new Date()));

  const tasks = useAppStore((state) => state.tasks);
  const habits = useAppStore((state) => state.habits);
  const toggleTask = useAppStore((state) => state.toggleTask);
  const bumpHabit = useAppStore((state) => state.bumpHabit);
  const shownEvents = useShownEvents();
  const byDay = useMemo(() => eventsByDay(shownEvents), [shownEvents]);
  const counts = useMemo(() => eventCountsByDay(shownEvents), [shownEvents]);
  const visibleTasks = useMemo(() => tasksForHome(tasks), [tasks]);

  /**
   * The habits as they stand today, so one whose day or week is over comes up
   * at zero and ready to be ticked again. Decided while drawing and not only
   * by `rollHabitPeriods`, which is what keeps it right whether or not the
   * housekeeping happened to run.
   */
  const shownHabits = useMemo(
    () => rolledOverHabits(habits, weekStart, dayEnd),
    [habits, weekStart, dayEnd],
  );

  const shownWeek = useMemo(
    () => weekDays(shownDay, weekStart),
    [shownDay, weekStart],
  );
  const weekEventCount = shownWeek.reduce(
    (total, day) => total + (counts.get(dayKey(day)) ?? 0),
    0,
  );

  const today = startOfDay(new Date());
  const header = homeHeaderCopy({
    view: calendarView,
    shownDay,
    dayEventCount: byDay.get(dayKey(shownDay))?.length ?? 0,
    weekEventCount,
    isCurrentWeek: shownWeek.some((day) => isSameDay(day, today)),
    language,
    translate: t,
  });

  /**
   * Opens a day tapped in the week or the month view: the day view, scrolled
   * to it. It is the view that answers "what is happening that day", which is
   * the question the tap asked. It is also the view remembered from then on,
   * since it is the one on screen.
   */
  const openDay = (day: Date) => {
    setShownDay(day);
    setCalendarView('Día');
  };

  /**
   * Everything opens in the app, whoever it belongs to. The detail screen is
   * the one that decides whether it can be changed.
   */
  const openItem = (id: string) => router.push(`/item/${id}`);

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 10 },
        ]}>
        <View style={styles.header}>
          <IconButton
            size={32}
            label={t('home.menuButtonLabel')}
            style={styles.menuButton}
            onPress={() => setDrawerOpen(true)}>
            <ListIcon size={20} color={color.textMuted} />
          </IconButton>

          <View style={styles.headerText}>
            <AppText weight={500} numberOfLines={1} style={styles.headerTitle}>
              {header.title}
            </AppText>
            <AppText style={styles.headerMeta}>{header.subtitle}</AppText>
          </View>

          {header.right ? (
            <AppText style={styles.headerMeta}>{header.right}</AppText>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.box}>
            <Tabs
              compact
              accessibilityLabel={t('home.calendarViewLabel')}
              options={CALENDAR_VIEWS.map(({ value, labelKey }) => ({
                value,
                label: t(labelKey),
              }))}
              value={calendarView}
              onChange={setCalendarView}
            />

            <View style={styles.boxContent}>
              {calendarView === 'Día' ? (
                <DayView
                  eventsByDay={byDay}
                  initialDay={shownDay}
                  onShowDay={setShownDay}
                  onPressEvent={(event) => openItem(event.id)}
                />
              ) : calendarView === 'Semana' ? (
                <WeekStrip
                  counts={counts}
                  initialDay={shownDay}
                  onShowWeek={setShownDay}
                  onPressDay={openDay}
                />
              ) : (
                <MonthExpanded
                  counts={counts}
                  initialDay={shownDay}
                  onShowMonth={setShownDay}
                  onPressDay={openDay}
                />
              )}
            </View>
          </View>

          <View style={styles.agendaBox}>
            <AgendaList
              tasks={visibleTasks}
              habits={shownHabits}
              onToggleTask={toggleTask}
              onBumpHabit={(id, delta) =>
                bumpHabit(id, delta, weekStart, dayEnd)
              }
              onOpenItem={openItem}
            />
          </View>
        </View>

        <Cta
          label={t('home.createButtonLabel')}
          onPress={() => router.push('/create')}
          icon={<PlusIcon size={16} color={accent} />}
        />
      </View>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAddSource={() => {
          setDrawerOpen(false);
          setAddSourceOpen(true);
        }}
      />
      <AddSourceSheet
        open={addSourceOpen}
        onClose={() => setAddSourceOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.background },
  screen: {
    flex: 1,
    paddingHorizontal: space.screen,
    gap: 10,
  },
  header: {
    /**
     * Fixed height on purpose: with automatic height the first text measurement
     * uses system font metrics and the calendar box slips over the header until
     * the next relayout.
     */
    height: size.header,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 6,
    zIndex: layer.header,
  },
  menuButton: { marginLeft: -5 },
  /**
   * Only texts go inside the row with `baseline`: mixing Views in makes Yoga's
   * first measurement come out short and the box below overlaps.
   */
  headerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 9,
  },
  headerTitle: { fontSize: 19, lineHeight: 26, letterSpacing: -0.3 },
  headerMeta: {
    fontSize: 10,
    letterSpacing: 1.6,
    color: color.label,
    textTransform: 'uppercase',
  },
  body: { flex: 1, gap: 10 },
  box: {
    height: '40%',
    backgroundColor: color.box,
    borderWidth: 1,
    borderColor: color.borderBox,
    borderRadius: radius.box,
    padding: 11,
    gap: 10,
    overflow: 'hidden',
  },
  boxContent: { flex: 1, minHeight: 0 },
  agendaBox: {
    flex: 1,
    backgroundColor: color.box,
    borderWidth: 1,
    borderColor: color.borderBox,
    borderRadius: radius.box,
    overflow: 'hidden',
  },
});
