import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  SectionList,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddSourceSheet } from '@/features/calendars/AddSourceSheet';
import { DayExpanded } from '@/features/home/DayExpanded';
import { HabitCard } from '@/features/home/HabitCard';
import { ModeColumn } from '@/features/home/ModeColumn';
import { MonthExpanded } from '@/features/home/MonthExpanded';
import { SideDrawer } from '@/features/home/SideDrawer';
import { TaskRow } from '@/features/home/TaskRow';
import { TodayTimeline } from '@/features/home/TodayTimeline';
import { WeekStrip } from '@/features/home/WeekStrip';
import { MONTHS, dayKey, fmtDayTitle, weekDays } from '@/lib/date';
import { countsByDay, eventsForDay, todayTasks, visibleEvents } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { T } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { color, radius, space } from '@/theme/tokens';
import { Cta, IconButton } from '@/ui/controls';
import { ListIcon, PlusIcon } from '@/ui/icons';
import type { Habit, Task } from '@/types';

type Mode = 'today' | 'week';

type Row =
  | { type: 'task'; task: Task }
  | { type: 'habits'; habits: Habit[] };

const GRID_GAP = 7;
/** Rejilla de hábitos: 2 columnas para que la tarjeta respire. */
const GRID_COLS = 2;
const BOX_PAD = 14;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { weekStart } = usePrefs();
  const accent = useAccent();

  const [mode, setMode] = useState<Mode>('today');
  const [expanded, setExpanded] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [addSource, setAddSource] = useState(false);
  const [focusDay, setFocusDay] = useState<Date | null>(null);
  const [gridWidth, setGridWidth] = useState(0);

  const events = useAppStore((s) => s.events);
  const calendars = useAppStore((s) => s.calendars);
  const tasks = useAppStore((s) => s.tasks);
  const habits = useAppStore((s) => s.habits);
  const toggleTask = useAppStore((s) => s.toggleTask);
  const bumpHabit = useAppStore((s) => s.bumpHabit);

  const today = new Date();
  const shown = useMemo(
    () => visibleEvents(events, calendars),
    [events, calendars],
  );
  const counts = useMemo(() => countsByDay(shown), [shown]);
  const days = useMemo(() => weekDays(new Date(), weekStart), [weekStart]);
  const todaysEvents = useMemo(
    () => eventsForDay(shown, new Date()),
    [shown],
  );

  const weekCount = days.reduce(
    (acc, d) => acc + (counts.get(dayKey(d)) ?? 0),
    0,
  );

  const visibleTasks = useMemo(() => todayTasks(tasks), [tasks]);
  const doneTasks = visibleTasks.filter((t) => t.done).length;
  const doneHabits = habits.filter((h) => h.progress >= h.target).length;

  const sections = useMemo(
    () => [
      {
        key: 'tasks',
        title: 'TAREAS',
        count: `${doneTasks}/${visibleTasks.length}`,
        data: visibleTasks.map<Row>((task) => ({ type: 'task', task })),
      },
      {
        key: 'habits',
        title: 'HÁBITOS',
        count: `${doneHabits}/${habits.length}`,
        data: [{ type: 'habits', habits } as Row],
      },
    ],
    [visibleTasks, habits, doneTasks, doneHabits],
  );

  const openDay = (day: Date) => {
    setFocusDay(day);
    setMode('today');
    setExpanded(true);
  };

  // Cabecera según el estado de la caja (mismo mapa que el prototipo).
  const headTitle = expanded
    ? mode === 'week'
      ? MONTHS[today.getMonth()]
      : fmtDayTitle(focusDay ?? today)
    : mode === 'week'
      ? 'Esta semana'
      : fmtDayTitle(today);

  const visibleDays = Math.max(1, Math.round((height - 220) / 132));
  const headSub = expanded
    ? mode === 'today'
      ? `${visibleDays} DÍAS`
      : String(today.getFullYear())
    : MONTHS[today.getMonth()].toUpperCase();

  const headRight = expanded
    ? ''
    : mode === 'today'
      ? `${todaysEvents.length} EVENTOS`
      : `${weekCount} EVENTOS`;

  const modeLabel = expanded
    ? mode === 'today'
      ? 'DÍA'
      : 'MES'
    : mode === 'today'
      ? 'HOY'
      : 'SEM';
  const modeOther = expanded
    ? mode === 'today'
      ? 'MES'
      : 'DÍA'
    : mode === 'today'
      ? 'SEM'
      : 'HOY';

  const cardWidth =
    gridWidth > 0
      ? (gridWidth - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS
      : 0;

  const modeColumn = (
    <ModeColumn
      label={modeLabel}
      other={modeOther}
      expanded={expanded}
      onToggleMode={() => setMode((m) => (m === 'today' ? 'week' : 'today'))}
      onToggleExpand={() => {
        setExpanded((e) => !e);
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
            style={{ marginLeft: -5 }}
            onPress={() => setDrawer(true)}>
            <ListIcon size={20} color={color.textMuted} />
          </IconButton>
          {/* Solo textos dentro de la fila con baseline: con Views mezcladas la
              primera medición de Yoga sale corta y la caja de abajo se solapa. */}
          <View style={styles.headerText}>
            <T w={500} numberOfLines={1} style={styles.headTitle}>
              {headTitle}
            </T>
            <T style={styles.headMeta}>{headSub}</T>
          </View>
          {headRight ? <T style={styles.headMeta}>{headRight}</T> : null}
        </View>

        {expanded ? (
          <View style={[styles.box, styles.boxExpanded]}>
            {modeColumn}
            {mode === 'today' ? (
              <DayExpanded
                events={shown}
                focusDay={focusDay}
                onPressEvent={(e) => router.push(`/item/${e.id}`)}
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
                  onPressEvent={(e) => router.push(`/item/${e.id}`)}
                />
              ) : (
                <WeekStrip days={days} counts={counts} onPressDay={openDay} />
              )}
            </View>

            <View style={styles.contentBox}>
              <SectionList
                sections={sections}
                keyExtractor={(item, index) =>
                  item.type === 'task' ? item.task.id : `habits-${index}`
                }
                stickySectionHeadersEnabled
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderSectionHeader={({ section }) => (
                  <View
                    style={[
                      styles.sectionHeader,
                      section.key === 'habits' && styles.sectionHeaderSecond,
                    ]}>
                    <T style={styles.sectionTitle}>{section.title}</T>
                    <T style={styles.sectionCount}>{section.count}</T>
                  </View>
                )}
                renderItem={({ item }) =>
                  item.type === 'task' ? (
                    <TaskRow
                      task={item.task}
                      onToggle={() => toggleTask(item.task.id)}
                      onOpenSettings={() => router.push(`/item/${item.task.id}`)}
                    />
                  ) : (
                    <View
                      style={styles.grid}
                      onLayout={(e) =>
                        setGridWidth(e.nativeEvent.layout.width)
                      }>
                      {cardWidth > 0
                        ? item.habits.map((habit) => (
                            <HabitCard
                              key={habit.id}
                              habit={habit}
                              width={cardWidth}
                              showStreak
                              onBump={(delta) => bumpHabit(habit.id, delta)}
                              onOpenSettings={() =>
                                router.push(`/item/${habit.id}`)
                              }
                            />
                          ))
                        : null}
                    </View>
                  )
                }
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
        open={drawer}
        onClose={() => setDrawer(false)}
        onAddSource={() => {
          setDrawer(false);
          setAddSource(true);
        }}
      />
      <AddSourceSheet open={addSource} onClose={() => setAddSource(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  screen: {
    flex: 1,
    paddingHorizontal: space.screen,
    gap: 10,
  },
  header: {
    // Alto fijo a propósito: con alto automático la primera medición del texto
    // usa métricas de la fuente de sistema y la caja del calendario se cuela
    // por encima hasta el siguiente relayout.
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 6,
    zIndex: 2,
  },
  headerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 9,
  },
  headTitle: { fontSize: 19, lineHeight: 26, letterSpacing: -0.3 },
  headMeta: {
    fontSize: 10,
    letterSpacing: 1.6,
    color: color.label,
    textTransform: 'uppercase',
  },
  collapsed: { flex: 1, gap: 10 },
  box: {
    backgroundColor: color.box,
    borderWidth: 1,
    borderColor: color.borderMut,
    borderRadius: radius.box,
    padding: 11,
    flexDirection: 'row',
    gap: 10,
  },
  boxCollapsed: { height: 200, overflow: 'hidden' },
  boxExpanded: { flex: 1, overflow: 'hidden' },
  contentBox: {
    flex: 1,
    backgroundColor: color.box,
    borderWidth: 1,
    borderColor: color.borderMut,
    borderRadius: radius.box,
    overflow: 'hidden',
  },
  listContent: { paddingHorizontal: BOX_PAD, paddingBottom: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    backgroundColor: color.box,
    marginHorizontal: -BOX_PAD,
    paddingHorizontal: BOX_PAD,
    paddingTop: 13,
    paddingBottom: 9,
  },
  sectionHeaderSecond: {
    marginTop: 12,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: color.line,
  },
  sectionTitle: { fontSize: 9, letterSpacing: 1.8, color: color.label },
  sectionCount: { fontSize: 9, letterSpacing: 1.2, color: color.faint },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    paddingTop: 9,
  },
});
