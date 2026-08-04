import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppStore } from '@/store/useAppStore';
import { Label, T } from '@/theme/Text';
import { color } from '@/theme/tokens';
import { Chip } from '@/ui/Chip';
import { Field } from '@/ui/Field';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { Cta } from '@/ui/controls';
import type { Provider } from '@/types';

const PROVIDERS: { label: string; value: Provider }[] = [
  { label: 'Google', value: 'GOOGLE' },
  { label: 'iCloud', value: 'ICLOUD' },
  { label: 'Outlook', value: 'OUTLOOK' },
];

type Props = {
  open: boolean;
  onClose: () => void;
  /** Proveedor preseleccionado al abrir desde Ajustes › Conectar. */
  initialProvider?: Provider;
};

/**
 * Alta de cuenta o suscripción. Mock: no hay OAuth ni descarga del .ics,
 * la fuente se añade solo al estado local.
 */
export function AddSourceSheet({ open, onClose, initialProvider }: Props) {
  const connectAccount = useAppStore((s) => s.connectAccount);
  const subscribeCalendar = useAppStore((s) => s.subscribeCalendar);
  const toast = useToast();

  const [tab, setTab] = useState<'account' | 'url'>('account');
  const [provider, setProvider] = useState<Provider>('GOOGLE');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  // Al abrir desde Ajustes › Conectar se preselecciona el proveedor. Se ajusta
  // en el render (patrón de estado derivado) en vez de en un efecto.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open && initialProvider) {
      setTab('account');
      setProvider(initialProvider);
    }
  }

  const reset = () => {
    setEmail('');
    setName('');
    setUrl('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (tab === 'account') {
      connectAccount(provider, email.trim());
      toast.show(`Cuenta ${email.trim()} conectada`);
    } else {
      subscribeCalendar(name.trim(), url.trim().endsWith('.ics') ? 'ICS' : 'CALDAV');
      toast.show(`${name.trim()} suscrito`);
    }
    close();
  };

  const valid =
    tab === 'account'
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      : name.trim().length > 0 && url.trim().length > 0;

  return (
    <Sheet open={open} onClose={close} title="Añadir cuenta o calendario">
      <View style={styles.tabs}>
        <Chip
          grow
          height={34}
          label="CUENTA"
          selected={tab === 'account'}
          onPress={() => setTab('account')}
        />
        <Chip
          grow
          height={34}
          label="SUSCRIPCIÓN"
          selected={tab === 'url'}
          onPress={() => setTab('url')}
        />
      </View>

      {tab === 'account' ? (
        <View style={styles.body}>
          <Label size={9}>Proveedor</Label>
          <View style={styles.row}>
            {PROVIDERS.map((p) => (
              <Chip
                key={p.value}
                grow
                label={p.label}
                selected={provider === p.value}
                onPress={() => setProvider(p.value)}
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
          <T style={styles.note}>
            En esta versión no se abre el navegador: la cuenta se añade en local
            para poder probar la interfaz.
          </T>
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
          <T style={styles.note}>
            Los calendarios suscritos por URL son de solo lectura.
          </T>
        </View>
      )}

      <Cta
        primary
        disabled={!valid}
        label={tab === 'account' ? 'CONECTAR' : 'SUSCRIBIR'}
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
