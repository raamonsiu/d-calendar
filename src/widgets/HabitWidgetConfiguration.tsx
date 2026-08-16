/**
 * The screen Android opens when the widget is added to the home screen, and
 * again when the user holds it and chooses to configure it.
 *
 * It is a real React Native screen, but it runs in its own activity, outside
 * the app's navigator and outside `PreferencesProvider`: nothing above it has
 * mounted, so it reads what it needs the same way the widget does and draws
 * with plain primitives rather than the app's `SecondaryScreen`.
 *
 * Picking a habit writes the link and closes with 'ok'. Backing out closes
 * with 'cancel', which is what tells Android to drop a widget that was never
 * configured.
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import type {
  HexColor,
  WidgetConfigurationScreenProps,
} from 'react-native-android-widget';

import { habitFrequencyLabel } from '@/lib/habits';
import type { Language } from '@/lib/language';
import { color, radius } from '@/theme/tokens';
import type { Habit } from '@/types';
import { HabitWidget } from './HabitWidget';
import { WIDGET_COPY } from './widgetCopy';
import { readHabits, linkWidgetToHabit } from './widgetData';
import {
  readAccent,
  readHighContrast,
  readLanguage,
} from './widgetPreferences';

/** What the screen needs before it can draw anything. */
type Loaded = {
  habits: Habit[];
  language: Language;
  accent: HexColor;
  highContrast: boolean;
};

/**
 * The screen itself. Split from the export because it reads the insets, and
 * the provider that measures them has to be above it.
 */
function ConfigurationScreen({
  widgetInfo,
  renderWidget,
  setResult,
}: WidgetConfigurationScreenProps) {
  const insets = useSafeAreaInsets();
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let subscribed = true;

    Promise.all([
      readHabits(),
      readLanguage(),
      readAccent(),
      readHighContrast(),
    ]).then(([habits, language, accent, highContrast]) => {
      if (subscribed) setLoaded({ habits, language, accent, highContrast });
    });

    return () => {
      subscribed = false;
    };
  }, []);

  /**
   * The insets are applied here and not in the stylesheet because this
   * activity draws behind the status bar and the gesture bar.
   */
  const padding = {
    paddingTop: insets.top + 20,
    paddingBottom: insets.bottom + 12,
  };

  /**
   * Nothing is drawn until the habits are read. Showing an empty list first
   * would say "no habits yet" to someone who has them.
   */
  if (!loaded) return <View style={[styles.screen, padding]} />;

  const copy = WIDGET_COPY[loaded.language];

  /**
   * Saves the choice and closes.
   *
   * The preview is drawn on a best effort: once the link is stored the widget
   * is configured, and Android asks for a draw straight afterwards anyway. A
   * preview that failed must not leave the screen open with the habit already
   * chosen and nothing happening, which is exactly what an unhandled
   * rejection here used to do.
   */
  const choose = async (habit: Habit) => {
    try {
      await linkWidgetToHabit(widgetInfo.widgetId, habit.id);
    } catch (error) {
      console.warn('Could not store the widget habit', error);
      setResult('cancel');
      return;
    }

    try {
      renderWidget(
        <HabitWidget
          habit={habit}
          accent={loaded.accent}
          language={loaded.language}
          highContrast={loaded.highContrast}
        />,
      );
    } catch (error) {
      console.warn('Could not draw the widget preview', error);
    }

    setResult('ok');
  };

  return (
    <View style={[styles.screen, padding]}>
      <Text style={styles.title}>{copy.configureTitle}</Text>

      {loaded.habits.length === 0 ? (
        <Text style={styles.hint}>{copy.noHabits}</Text>
      ) : (
        <>
          <Text style={styles.hint}>{copy.configureHint}</Text>
          <ScrollView contentContainerStyle={styles.list}>
            {loaded.habits.map((habit) => (
              <Pressable
                key={habit.id}
                accessibilityRole="button"
                onPress={() => choose(habit)}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: pressed ? color.cardHover : color.surface },
                ]}>
                <Text numberOfLines={2} style={styles.name}>
                  {habit.name}
                </Text>
                <Text style={styles.meta}>
                  {habitFrequencyLabel(habit, loaded.language)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => setResult('cancel')}
        style={styles.cancel}>
        <Text style={styles.cancelLabel}>{copy.cancel}</Text>
      </Pressable>
    </View>
  );
}

/**
 * Wraps the screen in its own safe area provider: it runs in an activity of
 * its own, with nothing of the app above it, so the one `_layout.tsx` mounts
 * is not there and the title would sit under the status bar.
 */
export function HabitWidgetConfiguration(props: WidgetConfigurationScreenProps) {
  return (
    <SafeAreaProvider>
      <ConfigurationScreen {...props} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.background,
    paddingHorizontal: 18,
    gap: 10,
  },
  title: { fontSize: 19, color: color.text },
  hint: { fontSize: 12, lineHeight: 17, color: color.textMuted },
  list: { gap: 6, paddingTop: 6, paddingBottom: 12 },
  row: {
    minHeight: 58,
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.card,
  },
  name: { fontSize: 13.5, color: color.textBody },
  meta: { fontSize: 9, letterSpacing: 1.1, color: color.labelDim },
  cancel: { height: 44, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { fontSize: 11.5, letterSpacing: 1.2, color: color.textMuted },
});
