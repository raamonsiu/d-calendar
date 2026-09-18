/**
 * Navigation root (expo-router).
 *
 * Mounts everything the whole app needs before the first screen: fonts, the
 * gesture container, safe area, preferences and toasts. No screen should mount
 * these providers again.
 *
 * `AppShell` decides what that first screen is: `src/features/onboarding/`
 * while `prefs.onboarded` is false, the navigator below once it is true, with
 * `src/features/welcome/`'s overlay covering it on a cold start. The wizard is
 * a plain component, not a route, so there is nothing to redirect away from
 * and no back button leaking out of it. `AppShell` is also what takes the
 * native splash down, once that first screen is in place.
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
import { isRunningInExpoGo } from 'expo';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Onboarding } from '@/features/onboarding/Onboarding';
import { WelcomeOverlay } from '@/features/welcome/WelcomeOverlay';
import { useDeviceCalendarSync } from '@/services/useDeviceCalendarSync';
import { useNotificationSync } from '@/services/useNotificationSync';
import { useSubscriptionSync } from '@/services/useSubscriptionSync';
import { useExpiryCleanup } from '@/services/useExpiryCleanup';
import { useWidgetSync } from '@/widgets/useWidgetSync';
import { useStoreHydrated } from '@/store/useAppStore';
import { PreferencesProvider, useDuration, usePrefs } from '@/theme/prefs';
import { color, duration } from '@/theme/tokens';
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
 * Whether this JS runtime has already decided on the welcome overlay. It lives
 * at module scope, outside any component, because on Android the React root
 * can be torn down and mounted again while the process, and the app's state
 * with it, survives: the activity is recreated when the system font or display
 * size changes, and on Android 11 and older when the user leaves with Back and
 * comes back. That is still an app that was open in the background, not a
 * fresh start, so it must not greet the user again.
 */
let welcomeDecidedThisRuntime = false;

/**
 * Everything that needs the preferences already mounted: the first-launch
 * wizard while `onboarded` is false, the real navigator once it is true.
 * Split out from `RootLayout` because `usePrefs()` only works below
 * `PreferencesProvider`, which `RootLayout` is the one mounting.
 *
 * Once onboarded, `WelcomeOverlay` also covers the navigator until dismissed.
 * `showWelcome` is decided once per JS runtime, on the first render of the
 * first `AppShell`, and only the overlay's own dismissal turns it off, so it
 * shows once per cold start: going to the background and back keeps the
 * runtime, and so does a remount of the React root, while reopening after the
 * process was actually killed starts a new one, which is the "hoy" the overlay
 * is describing. It starts false while the wizard is up, so finishing
 * onboarding lands on Home rather than on a summary of a calendar that is
 * still empty, and false too when the user set its duration to zero in
 * Settings. While it is up, the navigator is hidden from screen readers, which
 * would otherwise reach Home's controls behind the opaque overlay. That wrapper
 * is never collapsed, so the navigator keeps the same native parent when the
 * overlay leaves, and its screens are not detached and rebuilt.
 * `PreferencesProvider` draws nothing before it has the stored
 * values, so this first render already sees the user's own.
 */
function AppShell() {
  const prefs = usePrefs();
  const resolveDuration = useDuration();
  const [showWelcome, setShowWelcome] = useState(
    () =>
      !welcomeDecidedThisRuntime &&
      prefs.onboarded &&
      prefs.welcomeSeconds > 0,
  );
  const hideWelcome = useCallback(() => setShowWelcome(false), []);

  useEffect(() => {
    welcomeDecidedThisRuntime = true;
  }, []);

  /**
   * Takes the native splash down on this component's first layout, when the
   * first real screen - the wizard, or the welcome overlay over the navigator
   * - is already in the tree and about to be drawn, on the same background
   * colour. Hiding from an effect instead would take the splash down a frame
   * late, since an effect runs after the commit has been painted, while
   * `onLayout` fires while that first frame is still being laid out.
   *
   * The splash fades out over the given duration on Android always, and on
   * iOS because of `fade`. It goes through `useDuration()` like every other
   * animation, which is why it is set here, where the preferences are known,
   * and not when the module loads. Expo Go takes no splash options and warns
   * when given any, so there it only hides. Any later layout calls this
   * again, which the splash, already gone, ignores.
   */
  const hideSplash = () => {
    if (!isRunningInExpoGo()) {
      SplashScreen.setOptions({
        duration: resolveDuration(duration.overlay, 'overlay'),
        fade: true,
      });
    }
    SplashScreen.hide();
  };

  return (
    <View style={styles.shell} onLayout={hideSplash}>
      {prefs.onboarded ? (
        <>
          <BackgroundSync />
          <StatusBar style="light" />
          {showWelcome ? <WelcomeOverlay onDone={hideWelcome} /> : null}
          <View
            style={styles.shell}
            collapsable={false}
            importantForAccessibility={
              showWelcome ? 'no-hide-descendants' : 'auto'
            }
            accessibilityElementsHidden={showWelcome}>
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
          </View>
        </>
      ) : (
        <Onboarding onDone={() => prefs.setPreference('onboarded', true)} />
      )}
    </View>
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

  /**
   * Without the fonts and the stored data nothing is drawn: the splash screen
   * still covers everything, and stays up until `AppShell` takes it down.
   * Drawing earlier would show the seed data for an instant before the user's
   * own replaced it.
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
  shell: { flex: 1 },
  content: { backgroundColor: color.background },
});
