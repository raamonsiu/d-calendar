'use no memo';

/**
 * The home screen widget: one habit, its progress and its streak.
 *
 * The directive above is not optional. The widget library walks this tree by
 * calling each component as a plain function until it reaches one of its own
 * (`while (!jsxTree.type.__name__) jsxTree = jsxTree.type(jsxTree.props)`),
 * and this project builds with the React Compiler, which rewrites components
 * to use hooks. A hook called outside React throws, the widget never draws,
 * and because the failure happens inside a promise nothing is reported: the
 * widget simply stays blank and taps appear to do nothing.
 *
 * Drawn with the widget library's own vocabulary and not with the app's
 * components. Nothing from `src/ui` works here - the launcher renders native
 * views, so there is no React Native, no Reanimated and no `AppText`. What is
 * shared is `src/theme/tokens`, so the colours stay the app's.
 *
 * It has three faces: a habit with its dots, an invitation to pick one when
 * the widget has none, and a plus that opens the app when there is no habit
 * to pick yet.
 */
import {
  FlexWidget,
  OverlapWidget,
  TextWidget,
  type HexColor,
} from 'react-native-android-widget';

import { habitFrequencyLabel, habitStreakUnit, isHabitDone } from '@/lib/habits';
import type { Language } from '@/lib/language';
import { blend, color, radius, tint } from '@/theme/tokens';
import type { Habit } from '@/types';
import { liftedColor } from './widgetPreferences';

/** Action the handler receives when the widget is tapped to count one more. */
export const INCREMENT_ACTION = 'INCREMENT_HABIT';

/** Thickness of the line drawn over the name of a completed habit. */
const STRIKE_HEIGHT = 1;

/** Side of a progress dot, and the gap between two of them. */
const DOT_SIZE = 9;
const DOT_GAP = 5;

/**
 * Dots never wrap in a widget, so past this many the count is written out
 * instead. Twelve fits the narrowest size the widget can be resized to.
 */
const MAX_DOTS = 12;

type HabitWidgetProps = {
  /** The habit to draw, already rolled over into the current period. */
  habit: Habit;
  /** Accent the user chose, so the widget matches the app. */
  accent: HexColor;
  language: Language;
  /** Whether the accessibility preference asks for brighter dim tones. */
  highContrast: boolean;
};

/**
 * One repetition, filled when it is done. Drawn as a rounded square rather
 * than a circle because a widget has no border radius bigger than its side.
 */
function ProgressDot({
  filled,
  accent,
}: {
  filled: boolean;
  accent: HexColor;
}) {
  return (
    <FlexWidget
      style={{
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: filled ? accent : color.edge,
      }}
    />
  );
}

/** The habit's repetitions as dots, or as "3/20" when there are too many. */
function Progress({ habit, accent }: { habit: Habit; accent: HexColor }) {
  if (habit.target > MAX_DOTS) {
    return (
      <TextWidget
        text={`${habit.progress}/${habit.target}`}
        style={{ fontSize: 13, color: accent }}
      />
    );
  }

  return (
    <FlexWidget style={{ flexDirection: 'row', flexGap: DOT_GAP }}>
      {Array.from({ length: habit.target }, (_, index) => (
        <ProgressDot
          key={index}
          filled={index < habit.progress}
          accent={accent}
        />
      ))}
    </FlexWidget>
  );
}

/**
 * The habit's name, crossed out once the period is complete.
 *
 * `TextWidget` has no text decoration of its own, so the line is a view laid
 * over the text with `OverlapWidget`. The name is kept to a single line for
 * that reason: a line through the middle of a name that wrapped would cross
 * the gap between the two rows instead of the words.
 */
function HabitName({
  name,
  done,
  accent,
  highContrast,
}: {
  name: string;
  done: boolean;
  accent: HexColor;
  highContrast: boolean;
}) {
  const label = (
    <TextWidget
      text={name}
      maxLines={1}
      truncate="END"
      style={{
        fontSize: 15,
        color: done ? liftedColor(color.textMuted, highContrast) : color.text,
      }}
    />
  );

  if (!done) return label;

  return (
    <OverlapWidget style={{ width: 'wrap_content', height: 'wrap_content' }}>
      {label}
      <FlexWidget
        style={{
          width: 'match_parent',
          height: 'match_parent',
          justifyContent: 'center',
        }}>
        <FlexWidget
          style={{
            width: 'match_parent',
            height: STRIKE_HEIGHT,
            backgroundColor: accent,
          }}
        />
      </FlexWidget>
    </OverlapWidget>
  );
}

export function HabitWidget({
  habit,
  accent,
  language,
  highContrast,
}: HabitWidgetProps) {
  const done = isHabitDone(habit);

  return (
    <FlexWidget
      clickAction={INCREMENT_ACTION}
      clickActionData={{ habitId: habit.id }}
      accessibilityLabel={habit.name}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: radius.box,
        borderWidth: 1,
        borderColor: done ? accent : color.borderBox,
        backgroundColor: done
          ? blend(accent, color.box, tint.fill)
          : color.box,
      }}>
      <Progress habit={habit} accent={accent} />

      <FlexWidget style={{ flexDirection: 'column', flexGap: 3 }}>
        <HabitName
          name={habit.name}
          done={done}
          accent={accent}
          highContrast={highContrast}
        />
        <TextWidget
          text={`${habitFrequencyLabel(habit, language)} · ${habit.streak}${habitStreakUnit(habit)}`}
          style={{
            fontSize: 10,
            letterSpacing: 1,
            color: liftedColor(color.label, highContrast),
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

/**
 * What the widget shows before a habit has been picked, or after the one it
 * tracked was deleted. Holding the widget is how Android reaches the
 * configuration screen, so that is what it says.
 */
export function UnassignedWidget({ text }: { text: string }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel={text}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: radius.box,
        borderWidth: 1,
        borderColor: color.borderBox,
        backgroundColor: color.box,
      }}>
      <TextWidget
        text={text}
        maxLines={3}
        style={{ fontSize: 12, textAlign: 'center', color: color.textNote }}
      />
    </FlexWidget>
  );
}

/**
 * What the widget shows when the app has no habits at all: a plus that opens
 * the app, because there is nothing to pick yet.
 */
export function NoHabitsWidget({ accent }: { accent: HexColor }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel="+"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.box,
        borderWidth: 1,
        borderColor: color.borderBox,
        backgroundColor: color.box,
      }}>
      <TextWidget
        text="+"
        style={{ fontSize: 32, color: accent }}
      />
    </FlexWidget>
  );
}
