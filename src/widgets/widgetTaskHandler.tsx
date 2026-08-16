/**
 * What Android asks the app whenever something happens to a widget.
 *
 * It runs as a headless task: no screen, no providers, and often no running
 * app - Android starts the JS runtime just for this and tears it down after.
 * So everything it needs comes from `widgetData`, which reads the same
 * storage the app persists into.
 *
 * Registered in `index.js`, because the handler has to exist before Android
 * asks anything, which is earlier than any screen mounts.
 */
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import {
  readAccent,
  readHighContrast,
  readLanguage,
} from './widgetPreferences';
import {
  bumpHabitFromWidget,
  readHabits,
  readWidgetHabit,
  unlinkWidget,
} from './widgetData';
import {
  HabitWidget,
  INCREMENT_ACTION,
  NoHabitsWidget,
  UnassignedWidget,
} from './HabitWidget';
import { WIDGET_COPY } from './widgetCopy';

/**
 * Draws whatever the widget should be showing right now.
 *
 * Postcondition: always renders something. A widget with no habit picked, or
 * pointing at one that was deleted, falls back to the invitation rather than
 * being left with whatever it drew last.
 *
 * @param props What the library handed the handler.
 * @param habitId Habit to draw when it is already known, saving a read.
 */
async function render(props: WidgetTaskHandlerProps, habitId?: string) {
  const [language, accent, highContrast] = await Promise.all([
    readLanguage(),
    readAccent(),
    readHighContrast(),
  ]);
  const copy = WIDGET_COPY[language];

  const habit = habitId
    ? (await readHabits()).find((candidate) => candidate.id === habitId)
    : await readWidgetHabit(props.widgetInfo.widgetId);

  if (habit) {
    props.renderWidget(
      <HabitWidget
        habit={habit}
        accent={accent}
        language={language}
        highContrast={highContrast}
      />,
    );
    return;
  }

  /**
   * Nothing to draw and nothing to pick are different messages: one asks the
   * user to hold the widget, the other has no habit to offer and sends them
   * into the app to make one.
   */
  const anyHabits = (await readHabits()).length > 0;
  props.renderWidget(
    anyHabits ? (
      <UnassignedWidget text={copy.pickAHabit} />
    ) : (
      <NoHabitsWidget accent={accent} />
    ),
  );
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      await render(props);
      return;

    case 'WIDGET_DELETED':
      await unlinkWidget(props.widgetInfo.widgetId);
      return;

    case 'WIDGET_CLICK': {
      if (props.clickAction !== INCREMENT_ACTION) return;

      const habitId = props.clickActionData?.habitId;
      if (typeof habitId !== 'string') return;

      /**
       * The tap is counted first and the widget drawn from the result, so
       * what appears is the repetition the user just added and not a reread
       * that could still be catching up.
       */
      const bumped = await bumpHabitFromWidget(habitId);
      await render(props, bumped?.id);
      return;
    }
  }
}
