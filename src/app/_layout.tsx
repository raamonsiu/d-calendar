/**
 * Navigation root (expo-router).
 *
 * Mounts everything the whole app needs before the first screen: fonts, the
 * gesture container, safe area, preferences and toasts. No screen should mount
 * these providers again.
 *
 * `AppShell` decides what that first screen is: `src/features/onboarding/`
 * while `prefs.onboarded` is false, the navigator below once it is true. The
 * wizard is a plain component, not a route, so there is nothing to redirect
 * away from and no back button leaking out of it.
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

import { Onboarding } from '@/features/onboarding/Onboarding';
import { useDeviceCalendarSync } from '@/services/useDeviceCalendarSync';
import { useNotificationSync } from '@/services/useNotificationSync';
import { useSubscriptionSync } from '@/services/useSubscriptionSync';
import { useExpiryCleanup } from '@/services/useExpiryCleanup';
import { useWidgetSync } from '@/widgets/useWidgetSync';
import { useStoreHydrated } from '@/store/useAppStore';
import { PreferencesProvider, usePrefs } from '@/theme/prefs';
import { color } from '@/theme/tokens';
import { ToastProvider } from '@/ui/Toast';

SplashScreen.preventAutoHideAsync();

/**
 * Mounts the four background jobs: reading the calendars of the device,
 * downloading the ones subscribed by URL, scheduling the reminders, and
 * clearing what the calendar has left behind: tasks completed on an earlier
 * day and habits whose period is over. It draws nothing, and it has to
 * live inside `PreferencesProvider` because the notifications hook reads the
 * preference, which `RootLayout` itself creates.
 *
 * It is only mounted once onboarded, alongside the navigator: no reason to
 * sync anything before the user has even seen the app or granted a
 * permission.
 *
 * The order matters: the calendars come in first so the first reminder plan is
 * built with everything already in the store.
 */
function BackgroundSync() {
  useDeviceCalendarSync();
  useSubscriptionSync();
  useNotificationSync();
  useExpiryCleanup();
  useWidgetSync();
  return null;
}

/**
 * Everything that needs the preferences already mounted: the first-launch
 * wizard while `onboarded` is false, the real navigator once it is true.
 * Split out from `RootLayout` because `usePrefs()` only works below
 * `PreferencesProvider`, which `RootLayout` is the one mounting.
 */
function AppShell() {
  const prefs = usePrefs();

  if (!prefs.onboarded) {
    return (
      <Onboarding onDone={() => prefs.setPreference('onboarded', true)} />
    );
  }

  return (
    <>
      <BackgroundSync />
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
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontsFailed] = useFonts({
    RobotoSlab_300Light,
    RobotoSlab_400Regular,
    RobotoSlab_500Medium,
    RobotoMono_300Light,
    RobotoMono_400Regular,
    RobotoMono_500Medium,
  });

  const storeHydrated = useStoreHydrated();

  /**
   * A font that fails to load counts as loaded. `useFonts` leaves its flag false
   * for ever in that case, and since nothing is drawn until it turns true, the
   * app would sit on the splash screen with no way out and nothing said. Coming
   * up in the system font is worse than the design intends and better than not
   * coming up.
   */
  const ready = (fontsLoaded || !!fontsFailed) && storeHydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  /**
   * Without the fonts and the stored data nothing is drawn: the splash screen
   * still covers everything. Drawing earlier would show the seed data for an
   * instant before the user's own replaced it.
   */
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PreferencesProvider>
          <ToastProvider>
            <AppShell />
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
