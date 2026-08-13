import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  const [mode, setMode] = useState<SourceMode>(initialMode ?? 'account');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  /**
   * Where the accounts of the phone are, said in the words of each system. On
   * Android the button gets there on its own, so the line only names the place
   * it is about to open.
   */
  const accountPath = ACCOUNT_SETTINGS_DIRECT
    ? t('calendars.settingsWillOpen')
    : t('calendars.settingsPathHint');

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
      if (!opened) toast.show(t('calendars.settingsOpenFailedToast'));
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
    toast.show(t('calendars.addedToast', { name: name.trim() }));
    close();
  };

  return (
    <Sheet open={open} onClose={close} title={t('calendars.addSourceTitle')}>
      <View style={styles.tabs}>
        <Chip
          grow
          height={34}
          label={t('calendars.accountTab')}
          selected={mode === 'account'}
          onPress={() => setMode('account')}
        />
        <Chip
          grow
          height={34}
          label={t('calendars.subscriptionTab')}
          selected={mode === 'subscription'}
          onPress={() => setMode('subscription')}
        />
      </View>

      {mode === 'account' ? (
        <View style={styles.body}>
          <AppText style={styles.explain}>
            {t('calendars.accountExplain')}
          </AppText>
          <AppText style={styles.note}>{accountPath}</AppText>
        </View>
      ) : (
        <View style={styles.body}>
          <Field
            placeholder={t('calendars.namePlaceholder')}
            value={name}
            onChangeText={setName}
          />
          <Field
            autoCapitalize="none"
            keyboardType="url"
            placeholder={t('calendars.urlPlaceholder')}
            value={url}
            onChangeText={setUrl}
          />
          <AppText style={styles.note}>
            {t('calendars.subscriptionNote')}
          </AppText>
        </View>
      )}

      {mode === 'account' ? (
        <Cta
          primary
          label={t('calendars.openSettingsCta')}
          onPress={goToSettings}
        />
      ) : (
        <Cta
          primary
          disabled={!isValid}
          label={t('calendars.addCta')}
          onPress={subscribe}
        />
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
