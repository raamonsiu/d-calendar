/**
 * Help article (route `/help/[slug]`).
 *
 * How you get here: from the resource list in `/help`.
 *
 * Where it leads: back with the arrow. If the slug does not exist it redirects
 * to `/help`, which is what happens when someone opens a stale deep link.
 *
 * The content is typed blocks (`Block`) coming from `src/data/help.ts`:
 * paragraphs, headings, numbered steps and notes.
 */
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { topicBySlug, type Block } from '@/data/help';
import { groupRadius } from '@/lib/groupRadius';
import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { color, radius } from '@/theme/tokens';
import { SecondaryScreen } from '@/ui/SecondaryScreen';
import { Divider } from '@/ui/controls';
import { InfoIcon, ThumbsDownIcon, ThumbsUpIcon } from '@/ui/icons';

/** Gap between the two cards of the article: the "gap Nothing" one. */
const CARD_GAP = 5;

/** The two possible answers to the rating, each with its icon. */
const VERDICTS = [
  { value: 'yes', Icon: ThumbsUpIcon, labelKey: 'help.usefulYes' },
  { value: 'no', Icon: ThumbsDownIcon, labelKey: 'help.usefulNo' },
] as const;

type Verdict = (typeof VERDICTS)[number]['value'];

/** An article block together with the number it gets if it is a step. */
type NumberedBlock = { block: Block; step: number };

export default function HelpArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const { language } = usePrefs();
  const accent = useAccent();
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const topic = topicBySlug(slug);

  /**
   * Steps are numbered up front, before drawing: this way the render does not
   * depend on a counter being mutated while the list is walked.
   */
  const blocks = useMemo<NumberedBlock[]>(() => {
    let step = 0;
    return (topic?.blocks[language] ?? []).map((block) => {
      if (block.type === 'step') step += 1;
      return { block, step: block.type === 'step' ? step : 0 };
    });
  }, [topic, language]);

  if (!topic) return <Redirect href="/help" />;

  return (
    <SecondaryScreen compactTitle title={topic.title[language]} contentGap={CARD_GAP}>
      <View
        style={[styles.metaCard, groupRadius(0, 2, radius.box, radius.joined)]}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <AppText style={styles.meta}>{topic.meta[language]}</AppText>
      </View>

      <View style={[styles.body, groupRadius(1, 2, radius.box, radius.joined)]}>
        {blocks.map(({ block, step }, index) => (
          <ArticleBlock key={index} block={block} step={step} />
        ))}

        <Divider style={styles.divider} />

        <View style={styles.verdictRow}>
          <AppText style={styles.verdictLabel}>{t('help.wasItUseful')}</AppText>
          {VERDICTS.map(({ value, Icon, labelKey }) => {
            const selected = verdict === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={t(labelKey)}
                accessibilityState={{ selected }}
                onPress={() => setVerdict(value)}
                style={[
                  styles.verdictButton,
                  { borderColor: selected ? accent : color.border },
                ]}>
                <Icon size={14} color={selected ? accent : color.label} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </SecondaryScreen>
  );
}

/**
 * A single article block. Each type has its own shape: heading, paragraph,
 * numbered step with its badge, or note with its own surface and the info icon.
 */
function ArticleBlock({ block, step }: NumberedBlock) {
  const accent = useAccent();

  if (block.type === 'h') {
    return (
      <AppText weight={500} style={styles.heading}>
        {block.text}
      </AppText>
    );
  }

  if (block.type === 'p') {
    return <AppText style={styles.paragraph}>{block.text}</AppText>;
  }

  if (block.type === 'step') {
    return (
      <View style={styles.stepRow}>
        <View style={styles.stepBadge}>
          <AppText style={[styles.stepNumber, { color: accent }]}>
            {step}
          </AppText>
        </View>
        <AppText style={styles.stepText}>{block.text}</AppText>
      </View>
    );
  }

  return (
    <View style={styles.note}>
      <InfoIcon size={13} color={accent} />
      <AppText style={styles.noteText}>{block.text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  metaCard: {
    backgroundColor: color.surface,
    paddingVertical: 15,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  meta: { fontSize: 8.5, letterSpacing: 1.6, color: color.label },
  body: {
    backgroundColor: color.surface,
    padding: 18,
    gap: 13,
  },
  heading: { fontSize: 13, letterSpacing: 0.2, paddingTop: 4 },
  paragraph: { fontSize: 12.5, lineHeight: 19, color: color.textNote },
  stepRow: { flexDirection: 'row', gap: 11, alignItems: 'flex-start' },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.edge,
    backgroundColor: color.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumber: { fontSize: 9.5 },
  stepText: { flex: 1, fontSize: 12.5, lineHeight: 19, color: color.textSoft },
  note: {
    borderRadius: radius.pill,
    backgroundColor: color.cardHover,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  noteText: { flex: 1, fontSize: 11.5, lineHeight: 17, color: color.textNeutral },
  divider: { marginTop: 2 },
  verdictRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  verdictLabel: {
    flex: 1,
    fontSize: 10,
    letterSpacing: 1.1,
    color: color.labelDim,
  },
  verdictButton: {
    width: 36,
    height: 32,
    borderRadius: radius.chip,
    borderWidth: 1,
    backgroundColor: color.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
