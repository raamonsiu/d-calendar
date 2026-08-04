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
 * The calendar box has four states, combining mode (day or week) with size
 * (collapsed or expanded). Tapping a day in the week or month view opens that
 * day in the expanded view.
 */
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddSourceSheet } from '@/features/calendars/AddSourceSheet';
import { AgendaList } from '@/features/home/AgendaList';
import { DAY_ROW_HEIGHT, DayExpanded } from '@/features/home/DayExpanded';
import { ModeColumn } from '@/features/home/ModeColumn';
import { MonthExpanded } from '@/features/home/MonthExpanded';
import { SideDrawer } from '@/features/home/SideDrawer';
import { TodayTimeline } from '@/features/home/TodayTimeline';
import { WeekStrip } from '@/features/home/WeekStrip';
import { homeHeaderCopy, type CalendarMode } from '@/features/home/homeHeader';
import { dayKey, weekDays } from '@/lib/date';
import {
  eventCountsByDay,
  eventsForDay,
  tasksForHome,
  visibleEvents,
} from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { color, radius, size, space } from '@/theme/tokens';
import { Cta, IconButton } from '@/ui/controls';
import { ListIcon, PlusIcon } from '@/ui/icons';

/** Height taken by the header, the CTA and the gaps around the box. */
const CHROME_HEIGHT = 220;

/** Height of the calendar box while collapsed. */
const COLLAPSED_BOX_HEIGHT = 200;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { weekStart } = usePrefs();
  const accent = useAccent();

  const [mode, setMode] = useState<CalendarMode>('today');
  const [expanded, setExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [focusDay, setFocusDay] = useState<Date | null>(null);

  const events = useAppStore((state) => state.events);
  const calendars = useAppStore((state) => state.calendars);
  const tasks = useAppStore((state) => state.tasks);
  const habits = useAppStore((state) => state.habits);
  const toggleTask = useAppStore((state) => state.toggleTask);
  const bumpHabit = useAppStore((state) => state.bumpHabit);

  const shownEvents = useMemo(
    () => visibleEvents(events, calendars),
    [events, calendars],
  );
  const counts = useMemo(() => eventCountsByDay(shownEvents), [shownEvents]);
  const days = useMemo(() => weekDays(new Date(), weekStart), [weekStart]);
  const todaysEvents = useMemo(
    () => eventsForDay(shownEvents, new Date()),
    [shownEvents],
  );
  const visibleTasks = useMemo(() => tasksForHome(tasks), [tasks]);

  const weekEventCount = days.reduce(
    (total, day) => total + (counts.get(dayKey(day)) ?? 0),
    0,
  );

  const header = homeHeaderCopy({
    mode,
    expanded,
    focusDay,
    today: new Date(),
    todayEventCount: todaysEvents.length,
    weekEventCount,
    visibleDayCount: Math.max(
      1,
      Math.round((height - CHROME_HEIGHT) / DAY_ROW_HEIGHT),
    ),
  });

  /** Opens a specific day in the expanded day view. */
  const openDay = (day: Date) => {
    setFocusDay(day);
    setMode('today');
    setExpanded(true);
  };

  const openItem = (id: string) => router.push(`/item/${id}`);

  const modeColumn = (
    <ModeColumn
      label={header.modeLabel}
      other={header.otherModeLabel}
      expanded={expanded}
      onToggleMode={() =>
        setMode((current) => (current === 'today' ? 'week' : 'today'))
      }
      onToggleExpand={() => {
        setExpanded((current) => !current);
        setFocusDay(null);
      }}
    />
  );

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
            label="Menú"
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

        {expanded ? (
          <View style={[styles.box, styles.boxExpanded]}>
            {modeColumn}
            {mode === 'today' ? (
              <DayExpanded
                events={shownEvents}
                focusDay={focusDay}
                onPressEvent={(event) => openItem(event.id)}
              />
            ) : (
              <MonthExpanded counts={counts} onPressDay={openDay} />
            )}
          </View>
        ) : (
          <View style={styles.collapsed}>
            <View style={[styles.box, styles.boxCollapsed]}>
              {modeColumn}
              {mode === 'today' ? (
                <TodayTimeline
                  events={todaysEvents}
                  onPressEvent={(event) => openItem(event.id)}
                />
              ) : (
                <WeekStrip days={days} counts={counts} onPressDay={openDay} />
              )}
            </View>

            <View style={styles.agendaBox}>
              <AgendaList
                tasks={visibleTasks}
                habits={habits}
                onToggleTask={toggleTask}
                onBumpHabit={bumpHabit}
                onOpenItem={openItem}
              />
            </View>
          </View>
        )}

        <Cta
          label="CREAR"
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
    zIndex: 2,
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
  collapsed: { flex: 1, gap: 10 },
  box: {
    backgroundColor: color.box,
    borderWidth: 1,
    borderColor: color.borderBox,
    borderRadius: radius.box,
    padding: 11,
    flexDirection: 'row',
    gap: 10,
  },
  boxCollapsed: { height: COLLAPSED_BOX_HEIGHT, overflow: 'hidden' },
  boxExpanded: { flex: 1, overflow: 'hidden' },
  agendaBox: {
    flex: 1,
    backgroundColor: color.box,
    borderWidth: 1,
    borderColor: color.borderBox,
    borderRadius: radius.box,
    overflow: 'hidden',
  },
});
