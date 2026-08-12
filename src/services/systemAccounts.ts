/**
 * Getting to the place the phone keeps its accounts.
 *
 * The app has no OAuth of its own and wants none: the calendars it reads are
 * the ones the operating system already syncs, so adding a Google, an iCloud or
 * an Outlook account is something that happens in the system settings and shows
 * up here on the next read. This module is the way there, and the only place
 * that knows the names of those screens.
 */
import { Linking, Platform } from 'react-native';

/**
 * Android screens that lead to the accounts of the phone, best first.
 *
 * The first lands straight on the list of account types to add, which is the
 * one step being asked for. It is not on every phone - manufacturers rearrange
 * their settings - so the second is the accounts already added, which carries
 * its own button to add another.
 */
const ANDROID_ACCOUNT_SCREENS = [
  'android.settings.ADD_ACCOUNT_SETTINGS',
  'android.settings.SYNC_SETTINGS',
];

/**
 * Whether the system can be asked for the accounts screen itself, rather than
 * only for the app's own settings page.
 *
 * iOS has no public way into Settings › Calendario › Cuentas, which is why the
 * interface spells the path out there instead of promising a shortcut.
 */
export const ACCOUNT_SETTINGS_DIRECT = Platform.OS === 'android';

/**
 * Opens the system settings where the phone's accounts live.
 *
 * Postcondition: returns true when something was opened. It falls back through
 * the screens above and then to the app's own settings page, which at least
 * leaves the user inside Settings rather than nowhere.
 */
export async function openAccountSettings() {
  if (Platform.OS === 'android') {
    for (const action of ANDROID_ACCOUNT_SCREENS) {
      const opened = await Linking.sendIntent(action).then(
        () => true,
        () => false,
      );
      if (opened) return true;
    }
  }

  return Linking.openSettings().then(
    () => true,
    () => false,
  );
}
