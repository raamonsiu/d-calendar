/**
 * Create screen (route `/create`).
 *
 * How you get here: with the CREAR button on Home. It comes up from the bottom,
 * like a modal form.
 *
 * Where it leads: back to Home on save or on closing with the X. It does not
 * navigate anywhere else.
 *
 * The whole form lives in `ItemForm`, the same one the item detail uses: here
 * it is mounted without `editing`, which means create mode.
 */
import { ItemForm } from '@/features/create/ItemForm';

export default function CreateScreen() {
  return <ItemForm />;
}
