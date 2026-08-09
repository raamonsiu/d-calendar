/**
 * Downloading the calendars subscribed by URL.
 *
 * A subscription is not a protocol: it is an `.ics` file on a server that gets
 * fetched again every so often and read from scratch. There is no
 * authentication, no token and no API to register, which is why it works for a
 * course timetable, a holiday calendar or the secret iCal address of a Google
 * calendar without any of them knowing about this app.
 *
 * The reading itself is in `src/lib/ics.ts`, kept pure. What is here is the part
 * that touches the network.
 */
import { calendarWindow } from '@/lib/calendarWindow';
import { parseIcs } from '@/lib/ics';
import type { CalEvent, Calendar } from '@/types';

/** How long a download is given before it is abandoned. */
const TIMEOUT_MS = 20000;

/**
 * Size past which the file is refused.
 *
 * Some public calendars run to several megabytes, and parsing one of those
 * blocks the interface while it happens. Better to refuse it than to freeze.
 */
const MAX_CHARACTERS = 4_000_000;

/**
 * The scheme calendar links are usually published with, and what it means.
 *
 * `webcal://` is not a real scheme: it is `https://` with a hint to the system
 * that what is behind it is a calendar. Left as it is, `fetch` refuses it.
 */
const CALENDAR_SCHEME = 'webcal://';
const CALENDAR_SCHEME_REAL = 'https://';

/**
 * Downloads a subscribed calendar and reads its events.
 *
 * Precondition: `calendar.url` is set, which is what makes a calendar a
 * subscription. Postcondition: returns null when anything goes wrong — no
 * network, a server that answers with an error, a file too big, text that is not
 * a calendar — and the caller keeps whatever it already had, which is what makes
 * the app work on a train.
 *
 * @param calendar Subscribed calendar, with its address.
 * @param now Instant the read window is centred on.
 */
export async function downloadSubscription(
  calendar: Calendar,
  now: number,
): Promise<CalEvent[] | null> {
  if (!calendar.url) return null;

  const address = calendar.url.startsWith(CALENDAR_SCHEME)
    ? CALENDAR_SCHEME_REAL + calendar.url.slice(CALENDAR_SCHEME.length)
    : calendar.url;

  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(address, { signal: abort.signal });
    if (!response.ok) {
      console.warn(`[suscripción] ${calendar.name}: HTTP ${response.status}`);
      return null;
    }

    /**
     * The size is looked at before reading the body when the server announces
     * it, so a file too big is dropped without being pulled into memory first,
     * and looked at again afterwards for the servers that announce nothing.
     */
    const announced = Number(response.headers.get('content-length'));
    const text =
      announced > MAX_CHARACTERS ? null : await response.text();

    if (text === null || text.length > MAX_CHARACTERS) {
      console.warn(`[suscripción] ${calendar.name}: demasiado grande`);
      return null;
    }

    const { from, to } = calendarWindow(now);
    return parseIcs(text, calendar.id, from, to);
  } catch (error) {
    console.warn(`[suscripción] ${calendar.name}: no se pudo leer`, error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
