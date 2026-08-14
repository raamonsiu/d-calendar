/**
 * Legal document (route `/legal/[slug]`).
 *
 * How you get here: from the privacy policy or terms of use row in
 * `/about`.
 *
 * Where it leads: back with the arrow. If the slug does not exist it
 * redirects to `/about`, which is what happens when someone opens a stale
 * deep link.
 *
 * The content is typed blocks (`LegalBlock`) coming from `src/data/legal.ts`:
 * headings, paragraphs and notes, one document per slug.
 */
import { Redirect, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { legalDocumentBySlug, type LegalBlock } from '@/data/legal';
import { groupRadius } from '@/lib/groupRadius';
import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { color, radius } from '@/theme/tokens';
import { SecondaryScreen } from '@/ui/SecondaryScreen';
import { InfoIcon } from '@/ui/icons';

/** Gap between the two cards of the article: the "gap Nothing" one. */
const CARD_GAP = 5;

export default function LegalDocumentScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { language } = usePrefs();
  const document = legalDocumentBySlug(slug);

  if (!document) return <Redirect href="/about" />;

  return (
    <SecondaryScreen
      compactTitle
      title={document.title[language]}
      contentGap={CARD_GAP}>
      <View
        style={[styles.metaCard, groupRadius(0, 2, radius.box, radius.joined)]}>
        <AppText style={styles.meta}>{document.updated[language]}</AppText>
      </View>

      <View style={[styles.body, groupRadius(1, 2, radius.box, radius.joined)]}>
        {document.blocks[language].map((block, index) => (
          <LegalBlockView key={index} block={block} />
        ))}
      </View>
    </SecondaryScreen>
  );
}

/** A single block: heading, paragraph, or note with its own surface. */
function LegalBlockView({ block }: { block: LegalBlock }) {
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
  },
  meta: { fontSize: 10.5, letterSpacing: 0.4, color: color.labelDim },
  body: {
    backgroundColor: color.surface,
    padding: 18,
    gap: 13,
  },
  heading: { fontSize: 13, letterSpacing: 0.2, paddingTop: 4 },
  paragraph: { fontSize: 12.5, lineHeight: 19, color: color.textNote },
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
});
