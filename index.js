/**
 * Entry point of the app.
 *
 * It exists only because of the home screen widget: Android can ask about a
 * widget with the app closed, so the task handler and the configuration
 * screen have to be registered as the bundle loads, before any screen mounts.
 * `expo-router/entry`, which used to be the entry point on its own, is
 * imported first and still does everything it did.
 *
 * The widget library is Android only, so the registration is guarded: on web,
 * which is what `expo start --web` runs, importing it would fail.
 */
import 'expo-router/entry';
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  const {
    registerWidgetTaskHandler,
    registerWidgetConfigurationScreen,
  } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./src/widgets/widgetTaskHandler');
  const {
    HabitWidgetConfiguration,
  } = require('./src/widgets/HabitWidgetConfiguration');

  registerWidgetTaskHandler(widgetTaskHandler);
  registerWidgetConfigurationScreen(HabitWidgetConfiguration);
}
