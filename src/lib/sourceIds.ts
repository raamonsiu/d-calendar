/**
 * Naming of everything the app did not create itself.
 *
 * Accounts, calendars and events that come from somewhere else carry a prefix
 * in their id, one per source. That is what lets the store tell, on each read,
 * which of the things it holds it has to replace and which are its own, without
 * keeping a separate list of everything; and what lets a screen know, from the
 * id alone, whether the thing in front of it can be written to.
 */

/** Prefix of everything read from the calendars of the device. */
export const DEVICE_ID_PREFIX = 'device:';

/** Prefix of everything downloaded from a calendar subscribed by URL. */
export const SUBSCRIPTION_ID_PREFIX = 'ics:';

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
 * Whether something came from a subscribed calendar.
 *
 * Note that a subscribed *calendar* is the app's own - the user added it here,
 * and its id comes from `createId` - while its *events* are downloaded and carry
 * this prefix. Only the events are ever asked.
 *
 * @param id Id of an event.
 */
export const isSubscriptionId = (id: string) =>
  id.startsWith(SUBSCRIPTION_ID_PREFIX);

/**
 * Whether something came from outside the app, wherever that outside is.
 *
 * It is the question the form asks: an item that came from somewhere else is
 * not saved into the store, whatever else may be true about it.
 *
 * @param id Id of an event.
 */
export const isForeignId = (id: string) =>
  isDeviceId(id) || isSubscriptionId(id);

/**
 * Builds the app-side id of something read from the device.
 *
 * @param id Id the system gave it.
 */
export const toDeviceId = (id: string) => `${DEVICE_ID_PREFIX}${id}`;

/**
 * Recovers the id the system gave something, undoing `toDeviceId`.
 *
 * It is needed to ask the system about something by id, which is the one place
 * the app has to speak its language instead of its own.
 *
 * Postcondition: returns the id untouched when it carries no prefix.
 *
 * @param id Id in the app's model.
 */
export const fromDeviceId = (id: string) =>
  id.startsWith(DEVICE_ID_PREFIX) ? id.slice(DEVICE_ID_PREFIX.length) : id;
