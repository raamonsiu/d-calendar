import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';

import { color } from '@/theme/tokens';
import { Group } from '@/ui/Group';
import { GroupRow } from '@/ui/controls';
import {
  CalendarBlankIcon,
  CodeIcon,
  FireIcon,
  ListChecksIcon,
} from '@/ui/icons';

/**
 * Same GitHub profile About links to (`src/app/about.tsx`'s `DEV_LINKS`).
 * Duplicated rather than shared: the two screens have no common "developer
 * info" module to hang a single constant off, and it is one string.
 */
const GITHUB_URL = 'https://github.com/raamonsiu';

/**
 * Last onboarding step: three rows previewing what the app does, plus a row
 * naming the open-source licence and linking out to the code. "Get Started"
 * is drawn by `Onboarding`, not this step.
 */
export function FeaturesStep() {
  const { t } = useTranslation();

  const rows = [
    {
      label: t('onboarding.featureCreateLabel'),
      hint: t('onboarding.featureCreateHint'),
      Icon: CalendarBlankIcon,
      onPress: undefined,
    },
    {
      label: t('onboarding.featureHabitsLabel'),
      hint: t('onboarding.featureHabitsHint'),
      Icon: FireIcon,
      onPress: undefined,
    },
    {
      label: t('onboarding.featureTasksLabel'),
      hint: t('onboarding.featureTasksHint'),
      Icon: ListChecksIcon,
      onPress: undefined,
    },
    {
      label: t('onboarding.openSourceLabel'),
      hint: t('onboarding.openSourceHint'),
      Icon: CodeIcon,
      onPress: () => Linking.openURL(GITHUB_URL),
    },
  ];

  return (
    <Group title={t('onboarding.featuresTitle')}>
      {rows.map((row, index) => (
        <GroupRow
          key={row.label}
          index={index}
          count={rows.length}
          height={62}
          icon={<row.Icon size={15} color={color.textMuted} />}
          label={row.label}
          hint={row.hint}
          caret={!!row.onPress}
          onPress={row.onPress}
        />
      ))}
    </Group>
  );
}
