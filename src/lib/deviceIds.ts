/**
 * Naming of everything that comes from the calendars of the device.
 *
 * Accounts, calendars and events read from the system carry a prefix in their
 * id. That is what lets the store tell, on each read, which of the things it
 * holds it has to replace and which are the app's own, without keeping two
 * lists of everything.
 */

/** Prefix of every id that was not created by the app. */
export const DEVICE_ID_PREFIX = 'device:';

/**
 * Whether something was read from the device.
 *
 * Postcondition: false for anything the app created, whose ids come from
 * `createId` and never start with this prefix.
 *
 * @param id Id of an account, a calendar or an event.
 */
export const isDeviceId = (id: string) => id.startsWith(DEVICE_ID_PREFIX);

/**
 * Builds the app-side id of something read from the device.
 *
 * @param id Id the system gave it.
 */
export const toDeviceId = (id: string) => `${DEVICE_ID_PREFIX}${id}`;
