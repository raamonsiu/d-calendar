import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ACCOUNT_SETTINGS_DIRECT,
  openAccountSettings,
} from '@/services/systemAccounts';
import { useAppStore } from '@/store/useAppStore';
import { AppText } from '@/theme/Text';
import { color } from '@/theme/tokens';
import { Chip } from '@/ui/Chip';
import { Field } from '@/ui/Field';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { Cta } from '@/ui/controls';

/** The two things this sheet can add. */
export type SourceMode = 'account' | 'subscription';

/**
 * Where the accounts of the phone are, said in the words of each system. On
 * Android the button gets there on its own, so the line only names the place it
 * is about to open.
 */
const ACCOUNT_PATH = ACCOUNT_SETTINGS_DIRECT
  ? 'Se abrirán los ajustes de cuentas del teléfono.'
  : 'En Ajustes del sistema › Calendario › Cuentas.';

type AddSourceSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Tab the sheet opens on; without it, the account one. */
  initialMode?: SourceMode;
};

/**
 * Adding a calendar: an account of the phone, or a subscription by URL.
 *
 * The account side does not ask for anything, because there is nothing here to
 * ask for. The app has no OAuth: it reads the calendars the operating system
 * already syncs, so the honest form of "connect Google" is a way into the
 * system settings and the promise that what is added there turns up here on its
 * own, which is what the read on returning to the foreground does.
 *
 * The subscription side does take a name and a URL. Subscribing is nothing more
 * than keeping that address and downloading it again every so often, which is
 * what `useSubscriptionSync` does from the moment it is added.
 */
export function AddSourceSheet({
  open,
  onClose,
  initialMode,
}: AddSourceSheetProps) {
  const subscribeCalendar = useAppStore((state) => state.subscribeCalendar);
  const refresh = useAppStore((state) => state.refresh);
  const toast = useToast();

  const [mode, setMode] = useState<SourceMode>(initialMode ?? 'account');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  /**
   * Opening from Settings chooses the tab. It is adjusted during render
   * (derived state) instead of in an effect, which would trigger a second
   * paint.
   */
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open && initialMode) setMode(initialMode);
  }

  const close = () => {
    setName('');
    setUrl('');
    onClose();
  };

  const isValid = name.trim().length > 0 && url.trim().length > 0;

  /**
   * Hands over to the system settings and closes: what happens next happens
   * outside the app, and the sheet has nothing left to say.
   */
  const goToSettings = () => {
    close();
    openAccountSettings().then((opened) => {
      if (!opened) toast.show('No se pudieron abrir los ajustes');
    });
  };

  /**
   * Adds the calendar and asks for a sync, which is what downloads it: the
   * refresh is the one signal both the device read and the subscriptions
   * listen to.
   */
  const subscribe = () => {
    subscribeCalendar(name.trim(), url.trim());
    refresh();
    toast.show(`${name.trim()} añadido`);
    close();
  };

  return (
    <Sheet open={open} onClose={close} title="Añadir cuenta o calendario">
      <View style={styles.tabs}>
        <Chip
          grow
          height={34}
          label="CUENTA"
          selected={mode === 'account'}
          onPress={() => setMode('account')}
        />
        <Chip
          grow
          height={34}
          label="SUSCRIPCIÓN"
          selected={mode === 'subscription'}
          onPress={() => setMode('subscription')}
        />
      </View>

      {mode === 'account' ? (
        <View style={styles.body}>
          <AppText style={styles.explain}>
            Las cuentas se añaden al teléfono, no a la app: la app lee los
            calendarios que el sistema ya sincroniza. Al volver aparecerán aquí
            solos.
          </AppText>
          <AppText style={styles.note}>{ACCOUNT_PATH}</AppText>
        </View>
      ) : (
        <View style={styles.body}>
          <Field
            placeholder="Nombre del calendario"
            value={name}
            onChangeText={setName}
          />
          <Field
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://…/calendario.ics"
            value={url}
            onChangeText={setUrl}
          />
          <AppText style={styles.note}>
            Los calendarios por URL son de solo lectura. Se descargan al añadirlos
            y cada vez que abres la app.
          </AppText>
        </View>
      )}

      {mode === 'account' ? (
        <Cta primary label="ABRIR AJUSTES" onPress={goToSettings} />
      ) : (
        <Cta primary disabled={!isValid} label="AÑADIR" onPress={subscribe} />
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 5 },
  body: { gap: 7 },
  explain: {
    fontSize: 12,
    lineHeight: 18,
    color: color.textNote,
    paddingHorizontal: 2,
  },
  note: {
    fontSize: 10,
    lineHeight: 15,
    color: color.labelDim,
    paddingHorizontal: 2,
  },
});
