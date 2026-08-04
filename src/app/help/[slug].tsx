import { Redirect, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { topicBySlug } from '@/data/help';
import { T } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { color, radius, space } from '@/theme/tokens';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { Divider } from '@/ui/controls';
import { InfoIcon, ThumbsDownIcon, ThumbsUpIcon } from '@/ui/icons';

export default function HelpArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const [useful, setUseful] = useState<'yes' | 'no' | null>(null);

  const topic = topicBySlug(slug);

  // Los pasos se numeran de una vez: nada de contadores mutados en el render.
  const blocks = useMemo(() => {
    let step = 0;
    return (topic?.blocks ?? []).map((block) => ({
      block,
      step: block.type === 'step' ? ++step : 0,
    }));
  }, [topic]);

  if (!topic) return <Redirect href="/help" />;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 14 },
      ]}>
      <ScreenHeader compact title={topic.title} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        <View style={styles.metaCard}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <T style={styles.meta}>{topic.meta}</T>
        </View>

        <View style={styles.body}>
          {blocks.map(({ block, step }, i) => {
            if (block.type === 'h')
              return (
                <T key={i} w={500} style={styles.h}>
                  {block.text}
                </T>
              );

            if (block.type === 'p')
              return (
                <T key={i} style={styles.p}>
                  {block.text}
                </T>
              );

            if (block.type === 'step') {
              return (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <T style={[styles.stepNum, { color: accent }]}>{step}</T>
                  </View>
                  <T style={styles.stepText}>{block.text}</T>
                </View>
              );
            }

            return (
              <View key={i} style={styles.note}>
                <InfoIcon size={13} color={accent} />
                <T style={styles.noteText}>{block.text}</T>
              </View>
            );
          })}

          <Divider style={{ marginTop: 2 }} />

          <View style={styles.usefulRow}>
            <T style={styles.usefulLabel}>¿TE HA SERVIDO?</T>
            {(
              [
                ['yes', ThumbsUpIcon, 'Sí, me ha servido'],
                ['no', ThumbsDownIcon, 'No me ha servido'],
              ] as const
            ).map(([value, Icon, label]) => {
              const on = useful === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: on }}
                  onPress={() => setUseful(value)}
                  style={[
                    styles.usefulBtn,
                    { borderColor: on ? accent : color.border },
                  ]}>
                  <Icon size={14} color={on ? accent : color.label} />
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
    paddingHorizontal: space.screen,
    gap: 12,
  },
  scroll: { gap: 5, paddingBottom: 6 },
  metaCard: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.box,
    borderTopRightRadius: radius.box,
    borderBottomLeftRadius: radius.joined,
    borderBottomRightRadius: radius.joined,
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
    borderTopLeftRadius: radius.joined,
    borderTopRightRadius: radius.joined,
    borderBottomLeftRadius: radius.box,
    borderBottomRightRadius: radius.box,
    padding: 18,
    gap: 13,
  },
  h: { fontSize: 13, letterSpacing: 0.2, paddingTop: 4 },
  p: { fontSize: 12.5, lineHeight: 19, color: '#b9b9c1' },
  stepRow: { flexDirection: 'row', gap: 11, alignItems: 'flex-start' },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2f2f36',
    backgroundColor: color.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNum: { fontSize: 9.5 },
  stepText: { flex: 1, fontSize: 12.5, lineHeight: 19, color: color.textSoft },
  note: {
    borderRadius: 16,
    backgroundColor: color.cardHover,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  noteText: { flex: 1, fontSize: 11.5, lineHeight: 17, color: '#9a9aa2' },
  usefulRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  usefulLabel: { flex: 1, fontSize: 10, letterSpacing: 1.1, color: color.labelDim },
  usefulBtn: {
    width: 36,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: color.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
