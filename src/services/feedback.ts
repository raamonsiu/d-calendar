/**
 * Sending "Ayuda y comentarios" reports to the developer.
 *
 * The app has no server of its own to receive them, so the message is
 * relayed through EmailJS, which turns a plain POST into an email to the
 * developer inbox using a template configured on their dashboard. Web3Forms
 * was tried first, but it treats any call without a real browser origin as
 * server side and refuses it on the free plan, which a mobile app's `fetch`
 * always looks like; EmailJS has an explicit "allow API calls from
 * non-browser applications" setting for exactly this case.
 *
 * "Allow API calls" puts the account in strict mode, which drops the
 * browser-origin check but demands the account's Private Key on every call
 * instead, as `accessToken`. All four ids are read from `EXPO_PUBLIC_EMAILJS_*`
 * so none of them is hardcoded here. See `.env.example`. The template on the
 * EmailJS dashboard is expected to use `{{kind}}`, `{{title}}` and
 * `{{message}}`, with its own subject fixed on the dashboard rather than sent
 * as a variable.
 */

const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';

/** How long a submission is given before it is abandoned. */
const TIMEOUT_MS = 15000;

export type FeedbackReport = {
  kind: string;
  title: string;
  body: string;
};

/**
 * Sends a feedback report to the developer inbox through EmailJS.
 *
 * Precondition: `EXPO_PUBLIC_EMAILJS_SERVICE_ID`,
 * `EXPO_PUBLIC_EMAILJS_TEMPLATE_ID`, `EXPO_PUBLIC_EMAILJS_PUBLIC_KEY` and
 * `EXPO_PUBLIC_EMAILJS_PRIVATE_KEY` are all set; without any of them the
 * function refuses to try, since EmailJS would only answer with an error
 * the user can do nothing about.
 * Postcondition: never throws. Returns whether the relay accepted the
 * report; a failed send is reported to the caller as `false`, for the
 * screen to show as a toast.
 *
 * @param report What the user typed in the feedback sheet.
 */
export async function sendFeedback(report: FeedbackReport): Promise<boolean> {
  const serviceId = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EXPO_PUBLIC_EMAILJS_PRIVATE_KEY;
  if (!serviceId || !templateId || !publicKey || !privateKey) {
    console.warn('[feedback] the EXPO_PUBLIC_EMAILJS_* variables are missing');
    return false;
  }

  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(EMAILJS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: abort.signal,
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: {
          kind: report.kind,
          title: report.title,
          message: report.body || '(sin descripción)',
        },
      }),
    });

    if (!response.ok) {
      console.warn('[feedback] EmailJS answered', await response.text());
    }
    return response.ok;
  } catch (error) {
    console.warn('[feedback] could not be sent', error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
