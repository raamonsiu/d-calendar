import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TOPICS } from '@/data/help';
import { groupRadius } from '@/lib/groupRadius';
import { T } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { alpha, color, radius, space } from '@/theme/tokens';
import { Chip } from '@/ui/Chip';
import { Field } from '@/ui/Field';
import { Group } from '@/ui/Group';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { Sheet } from '@/ui/Sheet';
import { Cta } from '@/ui/controls';
import {
  CaretRightIcon,
  CheckIcon,
  EnvelopeSimpleIcon,
  PaperPlaneTiltIcon,
} from '@/ui/icons';

const KINDS = ['Error', 'Idea', 'Otro'];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const accent = useAccent();

  const [feedback, setFeedback] = useState<'form' | 'sent' | null>(null);
  const [kind, setKind] = useState('Error');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const closeFeedback = () => {
    setFeedback(null);
    setTitle('');
    setBody('');
  };

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 14 },
        ]}>
        <ScreenHeader title="Ayuda y comentarios" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>
          <Group title="Recursos populares">
            {TOPICS.map((topic, i) => (
              <Pressable
                key={topic.slug}
                accessibilityRole="button"
                onPress={() => router.push(`/help/${topic.slug}`)}
                style={({ pressed }) => [
                  styles.topic,
                  groupRadius(i, TOPICS.length),
                  { backgroundColor: pressed ? color.cardHover : color.surface },
                ]}>
                <topic.icon size={15} color={color.textMuted} />
                <View style={styles.topicBody}>
                  <T style={styles.topicTitle}>{topic.title}</T>
                  <T style={styles.topicMeta}>{topic.meta}</T>
                </View>
                <CaretRightIcon size={11} color="#3f3f47" />
              </Pressable>
            ))}
          </Group>

          <Group title="Enviar comentarios">
            <View style={styles.feedbackCard}>
              <T style={styles.feedbackText}>
                ¿Algo no funciona o echas algo en falta? Cuéntanoslo y lo leemos
                todo.
              </T>
              <Pressable
                accessibilityRole="button"
                onPress={() => setFeedback('form')}
                style={({ pressed }) => [
                  styles.feedbackCta,
                  {
                    borderColor: accent,
                    backgroundColor: alpha(accent, pressed ? 0.14 : 0.07),
                  },
                ]}>
                <PaperPlaneTiltIcon size={14} color={accent} />
                <T style={styles.feedbackCtaLabel}>ENVIAR COMENTARIO</T>
              </Pressable>
              <View style={styles.mailRow}>
                <EnvelopeSimpleIcon size={12} color={color.faint} />
                <T style={styles.mail}>soporte@d-calendar.app</T>
              </View>
            </View>
          </Group>
        </ScrollView>
      </View>

      <Sheet
        open={!!feedback}
        onClose={closeFeedback}
        title={feedback === 'sent' ? 'Gracias' : 'Nuevo comentario'}>
        {feedback === 'form' ? (
          <View style={{ gap: 5 }}>
            <View style={styles.kindRow}>
              {KINDS.map((k) => (
                <Chip
                  key={k}
                  grow
                  height={34}
                  label={k}
                  selected={kind === k}
                  onPress={() => setKind(k)}
                />
              ))}
            </View>
            <View style={[styles.inputBox, styles.inputBoxTop]}>
              <Field
                variant="bare"
                size={14}
                value={title}
                onChangeText={setTitle}
                placeholder="Título del comentario"
              />
            </View>
            <View style={[styles.inputBox, styles.inputBoxBottom]}>
              <Field
                variant="bare"
                multiline
                value={body}
                onChangeText={setBody}
                placeholder="Cuéntanos qué ha pasado, qué esperabas y en qué pantalla"
                style={styles.bodyInput}
              />
            </View>
            <View style={{ marginTop: 5 }}>
              <Cta
                primary
                disabled={!title.trim()}
                label="ENVIAR"
                onPress={() => setFeedback('sent')}
              />
            </View>
          </View>
        ) : (
          <View style={styles.sent}>
            <View
              style={[
                styles.sentIcon,
                { borderColor: accent, backgroundColor: alpha(accent, 0.1) },
              ]}>
              <CheckIcon size={19} color={accent} />
            </View>
            <T w={400} style={styles.sentTitle}>
              Comentario enviado
            </T>
            <T style={styles.sentText}>
              Gracias. Si hace falta más contexto te escribimos a
              dani@digimevo.com.
            </T>
          </View>
        )}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  screen: { flex: 1, paddingHorizontal: space.screen, gap: 12 },
  scroll: { gap: 16, paddingBottom: 6 },
  topic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 62,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  topicBody: { flex: 1, gap: 3 },
  topicTitle: { fontSize: 12.5, lineHeight: 16, color: color.textBody },
  topicMeta: { fontSize: 8.5, letterSpacing: 1.1, color: color.labelDim },
  feedbackCard: {
    backgroundColor: color.surface,
    borderRadius: radius.box,
    padding: 16,
    gap: 12,
  },
  feedbackText: { fontSize: 12.5, lineHeight: 18, color: '#b9b9c1' },
  feedbackCta: {
    height: 48,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  feedbackCtaLabel: { fontSize: 10, letterSpacing: 1.8, color: color.text },
  mailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 2,
  },
  mail: { fontSize: 9.5, letterSpacing: 0.6, color: color.labelDim },
  kindRow: { flexDirection: 'row', gap: 5 },
  inputBox: {
    backgroundColor: color.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  inputBoxTop: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
  },
  inputBoxBottom: {
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  bodyInput: { minHeight: 72, lineHeight: 19, color: '#b9b9c1' },
  sent: {
    alignItems: 'center',
    gap: 11,
    paddingTop: 14,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  sentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentTitle: { fontSize: 14 },
  sentText: {
    fontSize: 11.5,
    lineHeight: 17,
    color: color.textMuted,
    textAlign: 'center',
    maxWidth: 250,
  },
});
