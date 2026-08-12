/**
 * Reading the addresses of the calendars of the device.
 *
 * The system hands its calendars over in one flat list, with no notion of which
 * are yours, which someone shared with you and which you are merely subscribed
 * to. What it does give is a handful of addresses, and this module is the
 * single place that interprets them: which provider an account belongs to,
 * which section a calendar goes into, and when two calendars are really the
 * same one arriving twice.
 *
 * # How to extend it
 *
 * Everything that depends on how a provider names things lives in the tables
 * right below, and nothing else in the app needs to know about any of it:
 *
 * - A new provider (Zoho, Fastmail): add a row to `PROVIDERS`.
 * - A provider's calendars landing in the wrong section: its identifier domains
 *   go in `INFRASTRUCTURE_DOMAINS`, and its public calendars in
 *   `PUBLIC_NAMESPACES`.
 * - Calendars of the phone itself: `LOCAL_ACCOUNT_TYPES`.
 * - The interface changing language: `PREFERRED_LANGUAGE`.
 *
 * The functions underneath read those tables and nothing else, so a change up
 * there is the whole change.
 */
import type { Provider } from '@/types';

/**
 * Which provider each kind of account belongs to.
 *
 * The account type is what the system reports, and every platform names it its
 * own way: Android uses reverse domains ('com.google', 'com.android.exchange')
 * and iOS a closed set ('caldav', 'exchange', 'local'). Matching by fragment
 * covers both without a table per platform.
 *
 * Order matters: the first row whose fragments appear wins.
 */
const PROVIDERS: { fragments: string[]; provider: Provider }[] = [
  { fragments: ['google'], provider: 'GOOGLE' },
  { fragments: ['icloud', 'mobileme', 'apple'], provider: 'ICLOUD' },
  {
    fragments: ['exchange', 'microsoft', 'outlook', 'office', 'hotmail'],
    provider: 'OUTLOOK',
  },
  { fragments: ['yahoo', 'zoho', 'fastmail'], provider: 'CALDAV' },
];

/** Provider of an account whose type matches no row above. */
const FALLBACK_PROVIDER: Provider = 'CALDAV';

/**
 * Namespaces of the calendars nobody owns in person: holidays, birthdays,
 * sports, weather. Anything living here is a subscription.
 *
 * Watch the `.v.` of the first one: `group.calendar.google.com` without it is
 * where a calendar you created yourself lives, and confusing the two sends your
 * own calendars into the subscriptions.
 */
const PUBLIC_NAMESPACES = [
  'group.v.calendar.google.com',
  'holiday.calendar.google.com',
  'import.calendar.google.com',
];

/**
 * Domains a provider uses for its own identifiers instead of for people.
 *
 * An owner inside one of these is not somebody: it is the calendar naming
 * itself, which Google does with the secondary calendars a person creates. Read
 * as a person, it would turn every calendar of your own into one that a
 * stranger shared with you.
 */
const INFRASTRUCTURE_DOMAINS = ['calendar.google.com'];

/**
 * Account types of the calendars that belong to the phone and to no account.
 */
const LOCAL_ACCOUNT_TYPES = ['local'];

/**
 * Language of the interface. Of the several language versions a provider
 * publishes of the same public calendar, this is the one kept.
 */
const PREFERRED_LANGUAGE = 'es';

/**
 * Language a public calendar id starts with: the `es.` of
 * `es.spain#holiday@group.v.calendar.google.com`. The same calendar is
 * published once per language, each with its own id and everything else
 * identical.
 */
const LANGUAGE_PREFIX = /^([a-z]{2,3})([._-][a-z]{2,3})?\./;

/**
 * What a calendar of the device says about itself, reduced to what these
 * decisions need. Where each field comes from is written in
 * `services/deviceCalendars.ts`.
 */
export type CalendarOrigin = {
  /** Account it syncs under. */
  accountName: string;
  /** Kind of account: 'com.google', 'LOCAL', 'com.android.exchange'... */
  accountType: string;
  /** Account that owns it, which is not always the one it syncs under. */
  ownerAccount: string;
  /** Sync id, the same one on every account the calendar reaches. */
  internalName: string;
};

/**
 * The three places a calendar can end up: hanging from its account, among the
 * ones other people share, or among the subscriptions.
 */
export type CalendarPlacement = 'personal' | 'shared' | 'subscribed';

const normalise = (value: string) => value.trim().toLowerCase();

const containsAny = (value: string, fragments: string[]) =>
  fragments.some((fragment) => value.includes(fragment));

/**
 * Provider an account belongs to.
 *
 * Postcondition: always returns one of the five the app knows; anything
 * unrecognised comes back as `FALLBACK_PROVIDER`, which is the neutral one.
 *
 * @param accountType Kind of account as the system reports it.
 */
export function providerOf(accountType: string): Provider {
  const type = normalise(accountType);
  const match = PROVIDERS.find((row) => containsAny(type, row.fragments));
  return match?.provider ?? FALLBACK_PROVIDER;
}

/** true when the address is a public calendar and not a person's. */
const isPublicAddress = (address: string) =>
  containsAny(address, PUBLIC_NAMESPACES);

/**
 * true when the address is a person's, and not one of the identifiers a
 * provider builds for itself.
 */
const isPersonAddress = (address: string) =>
  address.includes('@') && !containsAny(address, INFRASTRUCTURE_DOMAINS);

/**
 * Whether an address belongs to somebody who is not the user.
 *
 * It is the question behind two different decisions — whether a calendar was
 * shared with them and whether an event is theirs to edit — and it is not the
 * same as "an address that is not mine". Two of the three ways an address can
 * fail to be one of theirs mean nothing at all: it may be missing, and it may be
 * one of the identifiers a provider writes in place of a person, which is what
 * Google does with every secondary calendar somebody creates. Read as a person,
 * that identifier turns a calendar of their own into a stranger's, and every
 * event they put in it into an event they may not touch.
 *
 * Postcondition: false for an empty address, so "nobody said" counts as theirs,
 * which is what an event nobody organises is.
 *
 * @param address Address to judge: an owner, an organiser.
 * @param ownAccounts Accounts the device syncs, which are all the user's.
 */
export function isAnotherPerson(
  address: string,
  ownAccounts: ReadonlySet<string> = new Set(),
) {
  const normalised = normalise(address);
  return (
    !!normalised && isPersonAddress(normalised) && !ownAccounts.has(normalised)
  );
}

/**
 * Where a calendar of the device belongs.
 *
 * The rule is not "a different owner means shared", because there are three
 * ways a calendar of your own carries someone else's owner: it may belong to
 * another account of yours, it may be a secondary calendar whose owner the
 * provider fills in with the calendar's own identifier, or it may have no owner
 * at all. Only an address belonging to a real person who is not you means
 * shared.
 *
 * The order of the checks matters: a public calendar is recognised before
 * comparing owners, because its owner is never the account it syncs under and
 * it would pass for something a colleague shared.
 *
 * Precondition: the fields come from the system and any of them may be empty;
 * `ownAccounts` holds every account present on the device, normalised.
 * Postcondition: 'personal' whenever there is no evidence of another person,
 * which is the safe answer: the worst case is a calendar hanging from its own
 * account, where the user will find it anyway.
 *
 * @param origin What the calendar says about itself.
 * @param ownAccounts Accounts the device syncs, which are all the user's.
 */
export function placeCalendar(
  origin: CalendarOrigin,
  ownAccounts: ReadonlySet<string> = new Set(),
): CalendarPlacement {
  const accountName = normalise(origin.accountName);
  const ownerAccount = normalise(origin.ownerAccount);
  const internalName = normalise(origin.internalName);

  if (containsAny(normalise(origin.accountType), LOCAL_ACCOUNT_TYPES)) {
    return 'subscribed';
  }
  if (isPublicAddress(ownerAccount) || isPublicAddress(internalName)) {
    return 'subscribed';
  }

  if (!ownerAccount || ownerAccount === accountName) return 'personal';

  return isAnotherPerson(ownerAccount, ownAccounts) ? 'shared' : 'personal';
}

/**
 * Which account a calendar of the user's own hangs from.
 *
 * The owner wins over the account it syncs under, so a calendar of one address
 * of theirs reaching the phone through another ends up where the user expects
 * it. When the owner is one of the provider's identifiers there is nothing to
 * read into it, and the account it syncs under is the answer.
 *
 * Precondition: `origin` is a calendar `placeCalendar` called 'personal'.
 * Postcondition: never empty as long as one of the two fields has something.
 *
 * @param origin What the calendar says about itself.
 * @param ownAccounts Accounts the device syncs.
 */
export function accountOf(
  origin: CalendarOrigin,
  ownAccounts: ReadonlySet<string> = new Set(),
) {
  const accountName = normalise(origin.accountName);
  const ownerAccount = normalise(origin.ownerAccount);

  const ownerIsAnAccount =
    isPersonAddress(ownerAccount) &&
    (ownerAccount === accountName || ownAccounts.has(ownerAccount));

  return ownerIsAnAccount ? ownerAccount : accountName;
}

/**
 * Key that recognises the same calendar arriving more than once.
 *
 * It arrives repeated for two reasons that pile up. Every account it was added
 * to syncs its own copy, and a public calendar is published once per language,
 * so the same bank holidays reach the phone as "Festivos en España", "Festius a
 * Espanya" and "Holidays in Spain", three ids for the same days.
 *
 * The sync id is what identifies a calendar, since it is identical in every
 * copy; on a public one the language is dropped from it, which is what
 * collapses the translations. The visible name is only the last resort, because
 * two different calendars can perfectly well share one.
 *
 * Postcondition: never empty, so two calendars with nothing to identify them
 * are not collapsed into one.
 *
 * @param origin What the calendar says about itself.
 * @param title Visible name, used when there is no sync id.
 */
export function calendarDedupeKey(origin: CalendarOrigin, title: string) {
  const internalName = normalise(origin.internalName);

  if (internalName) {
    const isPublic =
      isPublicAddress(internalName) ||
      isPublicAddress(normalise(origin.ownerAccount));

    return isPublic ? internalName.replace(LANGUAGE_PREFIX, '') : internalName;
  }

  const ownerAccount = normalise(origin.ownerAccount);
  if (ownerAccount) return ownerAccount;

  return normalise(title) || normalise(origin.accountName);
}

/**
 * Which copy of a repeated calendar to keep.
 *
 * It only decides between calendars sharing a key, which in practice means the
 * language versions of a public one. The interface is in Spanish, so the
 * Spanish version wins; a calendar with no language of its own comes next, and
 * the rest last.
 *
 * Postcondition: the higher the better, so the caller keeps the maximum.
 *
 * @param origin What the calendar says about itself.
 */
export function calendarPreference(origin: CalendarOrigin) {
  const language = LANGUAGE_PREFIX.exec(normalise(origin.internalName))?.[1];

  if (language === PREFERRED_LANGUAGE) return 2;
  if (!language) return 1;
  return 0;
}

/**
 * Who shared a calendar, in the micro label format of the side menu: the
 * address without its domain, which is what tells one colleague from another
 * without taking over the row.
 *
 * Postcondition: uppercase and cut short, because the label sits in the corner
 * of a row that belongs to the calendar's name.
 *
 * @param sharedBy Address of whoever shared it.
 * @param maxLength Characters the label may take.
 */
export function ownerLabel(sharedBy: string, maxLength = 12) {
  return sharedBy.split('@')[0].slice(0, maxLength).toUpperCase();
}
