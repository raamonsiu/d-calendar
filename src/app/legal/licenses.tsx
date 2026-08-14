/**
 * Open source licences (route `/legal/licenses`).
 *
 * How you get here: from the "Licencias de código abierto" row in `/about`.
 *
 * Where it leads: back with the arrow, or out to a package's repository in
 * the system browser.
 *
 * The list itself is data, not prose, which is why this is not `/legal/[slug]`
 * like the privacy policy and the terms: `src/data/licenses.ts` holds one row
 * per dependency, read from each package's own `package.json`.
 */
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { LICENSES } from '@/data/licenses';
import { AppText } from '@/theme/Text';
import { usePrefs } from '@/theme/prefs';
import { color } from '@/theme/tokens';
import { Group } from '@/ui/Group';
import { SecondaryScreen } from '@/ui/SecondaryScreen';
import { GroupRow } from '@/ui/controls';
import { ArrowUpRightIcon } from '@/ui/icons';

export default function LicensesScreen() {
  const { t } = useTranslation();
  const { language } = usePrefs();

  return (
    <SecondaryScreen compactTitle title={t('help.licensesTitle')}>
      <AppText style={styles.intro}>{t('help.licensesIntro')}</AppText>

      <Group
        title={t('help.dependenciesCount', { count: LICENSES.length })}>
        {LICENSES.map((entry, index) => (
          <GroupRow
            key={entry.name}
            index={index}
            count={LICENSES.length}
            height={64}
            label={entry.name}
            hint={entry.note[language]}
            value={entry.license}
            caret={false}
            right={<ArrowUpRightIcon size={12} color={color.caret} />}
            onPress={() => Linking.openURL(entry.url)}
          />
        ))}
      </Group>
    </SecondaryScreen>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: 12,
    lineHeight: 18,
    color: color.textMuted,
    paddingHorizontal: 4,
  },
});
