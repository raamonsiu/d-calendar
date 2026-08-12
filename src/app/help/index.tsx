/**
 * Help and feedback (route `/help`).
 *
 * How you get here: from the Home side menu.
 *
 * Where it leads: to `/help/[slug]` when a resource is tapped. The feedback
 * form opens in a bottom sheet over this same screen.
 *
 * "Enviar comentario" is `SecondaryScreen`'s `footer`, fixed below the scroll
 * rather than inside it: it is the one thing on this screen that should never
 * take scrolling past a long resource list to reach. "Recursos populares" is
 * the only thing that scrolls.
 *
 * Sending a report calls `sendFeedback`, which relays it through EmailJS:
 * the app has no server of its own to land it on. A failed send keeps the
 * form open with a toast instead of clearing it, so nothing typed is lost.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';

import { TOPICS } from '@/data/help';
import { groupRadius } from '@/lib/groupRadius';
import { sendFeedback } from '@/services/feedback';
import { AppText } from '@/theme/Text';
import { useAccent } from '@/theme/prefs';
import { alpha, color, radius, tint } from '@/theme/tokens';
import { Chip } from '@/ui/Chip';
import { Field } from '@/ui/Field';
import { Group } from '@/ui/Group';
import { SecondaryScreen } from '@/ui/SecondaryScreen';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { Cta } from '@/ui/controls';
import {
  CaretRightIcon,
  CheckIcon,
  EnvelopeSimpleIcon,
  PaperPlaneTiltIcon,
} from '@/ui/icons';

/** Kinds of feedback that can be sent. */
const FEEDBACK_KINDS = ['Error', 'Idea', 'Otro'];

/** Support address shown under the button. */
const SUPPORT_EMAIL = 'soporte@d-calendar.app';

/** CTA height on this screen, shorter than a bottom action bar. */
const CTA_HEIGHT = 48;

/** Which step the feedback sheet is on. */
type FeedbackStep = 'form' | 'sent' | null;

export default function HelpScreen() {
  const accent = useAccent();
  const toast = useToast();

  const [step, setStep] = useState<FeedbackStep>(null);
  const [kind, setKind] = useState(FEEDBACK_KINDS[0]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const closeFeedback = () => {
    setStep(null);
    setTitle('');
    setBody('');
  };

  const submitFeedback = async () => {
    Keyboard.dismiss();
    setSending(true);
    const sent = await sendFeedback({ kind, title, body });
    setSending(false);

    if (sent) {
      setStep('sent');
    } else {
      toast.show('No se pudo enviar. Inténtalo de nuevo.');
    }
  };

  return (
    <SecondaryScreen
      title="Ayuda y comentarios"
      overlays={
        <Sheet
          open={!!step}
          onClose={closeFeedback}
          title={step === 'sent' ? 'Gracias' : 'Nuevo comentario'}>
          {step === 'form' ? (
            <View style={styles.form}>
              <View style={styles.kindRow}>
                {FEEDBACK_KINDS.map((option) => (
                  <Chip
                    key={option}
                    grow
                    height={34}
                    label={option}
                    selected={kind === option}
                    onPress={() => setKind(option)}
                  />
                ))}
              </View>

              <View
                style={[
                  styles.inputBox,
                  groupRadius(0, 2, radius.card, radius.joined),
                ]}>
                <Field
                  variant="bare"
                  fontSize={14}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Título del comentario"
                />
              </View>

              <View
                style={[
                  styles.inputBox,
                  groupRadius(1, 2, radius.card, radius.joined),
                ]}>
                <Field
                  variant="bare"
                  multiline
                  value={body}
                  onChangeText={setBody}
                  placeholder="Cuéntanos qué ha pasado, qué esperabas y en qué pantalla"
                  style={styles.bodyInput}
                />
              </View>

              <View style={styles.submit}>
                <Cta
                  primary
                  disabled={!title.trim() || sending}
                  label={sending ? 'ENVIANDO…' : 'ENVIAR'}
                  onPress={submitFeedback}
                />
              </View>
            </View>
          ) : (
            <View style={styles.sent}>
              <View
                style={[
                  styles.sentIcon,
                  {
                    borderColor: accent,
                    backgroundColor: alpha(accent, tint.glyph),
                  },
                ]}>
                <CheckIcon size={19} color={accent} />
              </View>
              <AppText weight={400} style={styles.sentTitle}>
                Comentario enviado
              </AppText>
              <AppText style={styles.sentText}>
                Gracias. Si hace falta más contexto, escribe a{' '}
                {SUPPORT_EMAIL}.
              </AppText>
            </View>
          )}
        </Sheet>
      }
      footer={
        <View style={styles.footer}>
          <Group title="Enviar comentarios">
            <View style={styles.feedbackCard}>
              <AppText style={styles.feedbackText}>
                ¿Algo no funciona o echas algo en falta? Cuéntanoslo y lo
                leemos todo.
              </AppText>
              <Cta
                primary
                height={CTA_HEIGHT}
                label="ENVIAR COMENTARIO"
                icon={<PaperPlaneTiltIcon size={14} color={accent} />}
                onPress={() => setStep('form')}
              />
              <View style={styles.mailRow}>
                <EnvelopeSimpleIcon size={12} color={color.faint} />
                <AppText style={styles.mail}>{SUPPORT_EMAIL}</AppText>
              </View>
            </View>
          </Group>
        </View>
      }>
      <Group title="Recursos populares">
        {TOPICS.map((topic, index) => (
          <Pressable
            key={topic.slug}
            accessibilityRole="button"
            onPress={() => router.push(`/help/${topic.slug}`)}
            style={({ pressed }) => [
              styles.topic,
              groupRadius(index, TOPICS.length),
              { backgroundColor: pressed ? color.cardHover : color.surface },
            ]}>
            <topic.icon size={15} color={color.textMuted} />
            <View style={styles.topicBody}>
              <AppText style={styles.topicTitle}>{topic.title}</AppText>
              <AppText style={styles.topicMeta}>{topic.meta}</AppText>
            </View>
            <CaretRightIcon size={11} color={color.caret} />
          </Pressable>
        ))}
      </Group>
    </SecondaryScreen>
  );
}

const styles = StyleSheet.create({
  footer: { paddingTop: 16 },
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
  feedbackText: { fontSize: 12.5, lineHeight: 18, color: color.textNote },
  mailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 2,
  },
  mail: { fontSize: 9.5, letterSpacing: 0.6, color: color.labelDim },
  form: { gap: 5 },
  kindRow: { flexDirection: 'row', gap: 5 },
  inputBox: {
    backgroundColor: color.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  bodyInput: { minHeight: 72, lineHeight: 19, color: color.textNote },
  submit: { marginTop: 5 },
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
