/**
 * Navigation root (expo-router).
 *
 * Mounts everything the whole app needs before the first screen: fonts, the
 * gesture container, safe area, preferences and toasts. No screen should mount
 * these providers again.
 *
 * The route map is flat, with Home as the root:
 *
 * ```
 * /                     index               main screen
 * /create               create              form for a new item
 * /item/[id]            item/[id]           detail of an existing item
 * /settings             settings/index      settings
 * /settings/calendars   settings/calendars  accounts and calendars
 * /help                 help/index          help and feedback
 * /help/[slug]          help/[slug]         help article
 * /about                about               about the app
 * ```
 *
 * Screens slide in from the right, except Crear and the item detail, which come
 * up from the bottom because they are modal forms.
 *
 * Native headers are disabled: every screen draws its own with `ScreenHeader`
 * so the title follows the design typography.
 */
import {
  RobotoMono_300Light,
  RobotoMono_400Regular,
  RobotoMono_500Medium,
} from '@expo-google-fonts/roboto-mono';
import {
  RobotoSlab_300Light,
  RobotoSlab_400Regular,
  RobotoSlab_500Medium,
  useFonts,
} from '@expo-google-fonts/roboto-slab';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useNotificationSync } from '@/services/useNotificationSync';
import { PreferencesProvider } from '@/theme/prefs';
import { color } from '@/theme/tokens';
import { ToastProvider } from '@/ui/Toast';

SplashScreen.preventAutoHideAsync();

/**
 * Mounts the reminder scheduling. It draws nothing, and it has to live inside
 * `PreferencesProvider` because the hook reads the notifications preference,
 * which `RootLayout` itself creates.
 */
function NotificationSync() {
  useNotificationSync();
  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    RobotoSlab_300Light,
    RobotoSlab_400Regular,
    RobotoSlab_500Medium,
    RobotoMono_300Light,
    RobotoMono_400Regular,
    RobotoMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  /**
   * Without fonts nothing is drawn: the splash screen still covers everything.
   */
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PreferencesProvider>
          <ToastProvider>
            <NotificationSync />
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: styles.content,
                animation: 'slide_from_right',
              }}>
              <Stack.Screen name="index" />
              <Stack.Screen
                name="create"
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="item/[id]"
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen name="settings/index" />
              <Stack.Screen name="settings/calendars" />
              <Stack.Screen name="help/index" />
              <Stack.Screen name="help/[slug]" />
              <Stack.Screen name="about" />
            </Stack>
          </ToastProvider>
        </PreferencesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.background },
  content: { backgroundColor: color.background },
});
