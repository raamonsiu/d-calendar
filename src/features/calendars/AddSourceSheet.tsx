import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppStore } from '@/store/useAppStore';
import { AppText, Label } from '@/theme/Text';
import { color } from '@/theme/tokens';
import { Chip } from '@/ui/Chip';
import { Field } from '@/ui/Field';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { Cta } from '@/ui/controls';
import type { Provider } from '@/types';

/** Providers that can be connected with an account. */
const PROVIDERS: { label: string; value: Provider }[] = [
  { label: 'Google', value: 'GOOGLE' },
  { label: 'iCloud', value: 'ICLOUD' },
  { label: 'Outlook', value: 'OUTLOOK' },
];

/** Minimal email validation: some text, an at sign and a dotted domain. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SourceMode = 'account' | 'subscription';

type AddSourceSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Provider preselected when opening from Settings › Conectar. */
  initialProvider?: Provider;
};

/**
 * Adding an account or a URL subscription.
 *
 * Both tabs share the sheet and the CTA, and swap the form and the validation:
 * the account needs a well formed email, the subscription a name and a URL. The
 * CTA stays disabled until its own side is valid.
 *
 * Mock: there is no OAuth and no `.ics` download; the source is only added to
 * local state.
 */
export function AddSourceSheet({
  open,
  onClose,
  initialProvider,
}: AddSourceSheetProps) {
  const connectAccount = useAppStore((state) => state.connectAccount);
  const subscribeCalendar = useAppStore((state) => state.subscribeCalendar);
  const toast = useToast();

  const [mode, setMode] = useState<SourceMode>('account');
  const [provider, setProvider] = useState<Provider>('GOOGLE');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  /**
   * Opening from Settings › Conectar preselects the provider. It is adjusted
   * during render (derived state) instead of in an effect, which would trigger
   * a second paint.
   */
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open && initialProvider) {
      setMode('account');
      setProvider(initialProvider);
    }
  }

  const close = () => {
    setEmail('');
    setName('');
    setUrl('');
    onClose();
  };

  const isValid =
    mode === 'account'
      ? EMAIL_PATTERN.test(email.trim())
      : name.trim().length > 0 && url.trim().length > 0;

  const submit = () => {
    if (mode === 'account') {
      connectAccount(provider, email.trim());
      toast.show(`Cuenta ${email.trim()} conectada`);
    } else {
      subscribeCalendar(
        name.trim(),
        url.trim().endsWith('.ics') ? 'ICS' : 'CALDAV',
      );
      toast.show(`${name.trim()} suscrito`);
    }
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
          <Label size={9}>Proveedor</Label>
          <View style={styles.row}>
            {PROVIDERS.map((option) => (
              <Chip
                key={option.value}
                grow
                label={option.label}
                selected={provider === option.value}
                onPress={() => setProvider(option.value)}
              />
            ))}
          </View>
          <Field
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="tu@correo.com"
            value={email}
            onChangeText={setEmail}
          />
          <AppText style={styles.note}>
            En esta versión no se abre el navegador: la cuenta se añade en local
            para poder probar la interfaz.
          </AppText>
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
            Los calendarios suscritos por URL son de solo lectura.
          </AppText>
        </View>
      )}

      <Cta
        primary
        disabled={!isValid}
        label={mode === 'account' ? 'CONECTAR' : 'SUSCRIBIR'}
        onPress={submit}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 5 },
  body: { gap: 7 },
  row: { flexDirection: 'row', gap: 5 },
  note: {
    fontSize: 10,
    lineHeight: 15,
    color: color.labelDim,
    paddingHorizontal: 2,
  },
});
