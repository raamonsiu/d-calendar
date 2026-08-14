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
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';

import { TOPICS } from '@/data/help';
import { groupRadius } from '@/lib/groupRadius';
import { sendFeedback } from '@/services/feedback';
import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { color, radius } from '@/theme/tokens';
import { Chip } from '@/ui/Chip';
import { Field } from '@/ui/Field';
import { Group } from '@/ui/Group';
import { IconCircle } from '@/ui/IconCircle';
import { SecondaryScreen } from '@/ui/SecondaryScreen';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { Cta } from '@/ui/controls';
import { CaretRightIcon, CheckIcon, PaperPlaneTiltIcon } from '@/ui/icons';

/**
 * Kinds of feedback that can be sent. The value travels to the developer's
 * inbox and stays the same in every language, the way the store's own union
 * values do; only the chip label follows the language.
 */
const FEEDBACK_KINDS = [
  { value: 'Error', labelKey: 'help.kindError' },
  { value: 'Idea', labelKey: 'help.kindIdea' },
  { value: 'Otro', labelKey: 'help.kindOther' },
] as const;

/** CTA height on this screen, shorter than a bottom action bar. */
const CTA_HEIGHT = 48;

/** Which step the feedback sheet is on. */
type FeedbackStep = 'form' | 'sent' | null;

export default function HelpScreen() {
  const { t } = useTranslation();
  const { language } = usePrefs();
  const accent = useAccent();
  const toast = useToast();

  const [step, setStep] = useState<FeedbackStep>(null);
  const [kind, setKind] = useState<string>(FEEDBACK_KINDS[0].value);
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
      toast.show(t('help.feedbackFailed'));
    }
  };

  return (
    <SecondaryScreen
      title={t('help.title')}
      overlays={
        <Sheet
          open={!!step}
          onClose={closeFeedback}
          title={step === 'sent' ? t('help.thanks') : t('help.newFeedback')}>
          {step === 'form' ? (
            <View style={styles.form}>
              <View style={styles.kindRow}>
                {FEEDBACK_KINDS.map((option) => (
                  <Chip
                    key={option.value}
                    grow
                    height={34}
                    label={t(option.labelKey)}
                    selected={kind === option.value}
                    onPress={() => setKind(option.value)}
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
                  placeholder={t('help.feedbackTitlePlaceholder')}
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
                  placeholder={t('help.feedbackBodyPlaceholder')}
                  style={styles.bodyInput}
                />
              </View>

              <View style={styles.submit}>
                <Cta
                  primary
                  disabled={!title.trim() || sending}
                  label={sending ? t('help.sending') : t('help.send')}
                  onPress={submitFeedback}
                />
              </View>
            </View>
          ) : (
            <View style={styles.sent}>
              <IconCircle icon={<CheckIcon size={19} color={accent} />} />
              <AppText weight={400} style={styles.sentTitle}>
                {t('help.feedbackSent')}
              </AppText>
              <AppText style={styles.sentText}>
                {t('help.feedbackSentHint')}
              </AppText>
            </View>
          )}
        </Sheet>
      }
      footer={
        <View style={styles.footer}>
          <Group title={t('help.sendFeedbackSection')}>
            <View style={styles.feedbackCard}>
              <AppText style={styles.feedbackText}>
                {t('help.feedbackPitch')}
              </AppText>
              <Cta
                primary
                height={CTA_HEIGHT}
                label={t('help.sendFeedbackCta')}
                icon={<PaperPlaneTiltIcon size={14} color={accent} />}
                onPress={() => setStep('form')}
              />
            </View>
          </Group>
        </View>
      }>
      <Group title={t('help.popularResources')}>
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
              <AppText style={styles.topicTitle}>{topic.title[language]}</AppText>
              <AppText style={styles.topicMeta}>{topic.meta[language]}</AppText>
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
  sentTitle: { fontSize: 14 },
  sentText: {
    fontSize: 11.5,
    lineHeight: 17,
    color: color.textMuted,
    textAlign: 'center',
    maxWidth: 250,
  },
});
