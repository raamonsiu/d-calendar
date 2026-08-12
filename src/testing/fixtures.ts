/**
 * Fixture builders shared by more than one test file.
 *
 * Kept to the ones actually reused twice: a builder that only one test file
 * needs stays local to it, next to the tests that use it.
 */
import type { Guest } from '@/types';

/**
 * A guest, defaulting to an address derived from its id so a test rarely has
 * to spell one out.
 *
 * @param id Id of the guest; a device attendee id when the test means one
 * already on the device, anything else when it means one typed into the form.
 * @param email Address to invite; defaults to `${id}@x.com`.
 */
export function guest(id: string, email = `${id}@x.com`): Guest {
  return {
    id,
    email,
    name: email,
    initial: email[0]?.toUpperCase() ?? '',
    state: 'PENDIENTE',
  };
}
