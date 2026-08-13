import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionList, StyleSheet, View } from 'react-native';

import { gridCellSize } from '@/lib/layout';
import { isHabitDone } from '@/lib/habits';
import { AppText } from '@/theme/Text';
import { color } from '@/theme/tokens';
import type { Habit, Task } from '@/types';
import { HabitCard } from './HabitCard';
import { TaskRow } from './TaskRow';

/** Habit grid: two columns so the card has room to breathe. */
const GRID_COLUMNS = 2;
const GRID_GAP = 7;

/** Side padding of the box, which the sticky headers have to cancel out. */
const BOX_PADDING = 14;

/**
 * One row of the list: either a task, or the whole habit grid. Habits take a
 * single row because the grid lays itself out.
 */
type AgendaRow =
  | { type: 'task'; task: Task }
  | { type: 'habits'; habits: Habit[] };

type AgendaListProps = {
  tasks: Task[];
  habits: Habit[];
  onToggleTask: (id: string) => void;
  onBumpHabit: (id: string, delta: 1 | -1) => boolean;
  /** Opens the detail of a task or a habit. */
  onOpenItem: (id: string) => void;
};

/**
 * List of tasks and habits on Home, with the two sticky section headers and
 * their completed counter. Below the tasks, while there is at least one, a
 * caption explains that a completed one disappears the next day.
 *
 * The habit grid is measured with `onLayout` and the cards are drawn once the
 * column width is known.
 */
export function AgendaList({
  tasks,
  habits,
  onToggleTask,
  onBumpHabit,
  onOpenItem,
}: AgendaListProps) {
  const { t } = useTranslation();
  const [gridWidth, setGridWidth] = useState(0);
  const cardWidth = gridCellSize(gridWidth, GRID_GAP, GRID_COLUMNS);

  const sections = useMemo(() => {
    const doneTasks = tasks.filter((task) => task.done).length;
    const doneHabits = habits.filter(isHabitDone).length;

    return [
      {
        key: 'tasks',
        title: t('home.tasksSectionTitle'),
        count: `${doneTasks}/${tasks.length}`,
        data: tasks.map<AgendaRow>((task) => ({ type: 'task', task })),
      },
      {
        key: 'habits',
        title: t('home.habitsSectionTitle'),
        count: `${doneHabits}/${habits.length}`,
        data: [{ type: 'habits', habits } as AgendaRow],
      },
    ];
  }, [tasks, habits, t]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(row, index) =>
        row.type === 'task' ? row.task.id : `habits-${index}`
      }
      stickySectionHeadersEnabled
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      renderSectionHeader={({ section }) => (
        <View
          style={[
            styles.sectionHeader,
            section.key === 'habits' && styles.sectionHeaderSecond,
          ]}>
          <AppText style={styles.sectionTitle}>{section.title}</AppText>
          <AppText style={styles.sectionCount}>{section.count}</AppText>
        </View>
      )}
      renderSectionFooter={({ section }) =>
        section.key === 'tasks' && tasks.length > 0 ? (
          <AppText style={styles.tasksHint}>
            {t('home.tasksAutoDeleteHint')}
          </AppText>
        ) : null
      }
      renderItem={({ item: row }) =>
        row.type === 'task' ? (
          <TaskRow
            task={row.task}
            onToggle={() => onToggleTask(row.task.id)}
            onOpenSettings={() => onOpenItem(row.task.id)}
          />
        ) : (
          <View
            style={styles.grid}
            onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}>
            {cardWidth > 0
              ? row.habits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    width={cardWidth}
                    showStreak
                    onBump={(delta) => onBumpHabit(habit.id, delta)}
                    onOpenSettings={() => onOpenItem(habit.id)}
                  />
                ))
              : null}
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: BOX_PADDING, paddingBottom: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    backgroundColor: color.box,
    marginHorizontal: -BOX_PADDING,
    paddingHorizontal: BOX_PADDING,
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
  tasksHint: {
    fontSize: 9,
    letterSpacing: 0.4,
    color: color.labelDim,
    paddingTop: 8,
    paddingBottom: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    paddingTop: 9,
  },
});
