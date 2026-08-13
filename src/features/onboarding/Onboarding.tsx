import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAccent, useDuration } from '@/theme/prefs';
import { color, duration, space } from '@/theme/tokens';
import { Cta } from '@/ui/controls';
import { FeaturesStep } from './FeaturesStep';
import { PermissionsStep } from './PermissionsStep';
import { WelcomeStep } from './WelcomeStep';

/** The onboarding steps, in the order they are shown. */
const STEPS = [WelcomeStep, PermissionsStep, FeaturesStep];
const LAST_STEP = STEPS.length - 1;

/**
 * First-launch wizard: welcome, then the two permissions, then a preview of
 * what the app does. Rendered by `_layout.tsx` instead of the normal
 * navigator while `prefs.onboarded` is false, so there is no route, no back
 * button leaking out of it and nothing else mounted underneath it yet.
 *
 * @param onDone Called once, when "Empezar" is pressed on the last step.
 */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const accent = useAccent();
  const insets = useSafeAreaInsets();
  const resolveDuration = useDuration();
  const [step, setStep] = useState(0);

  const Step = STEPS[step];
  const isLast = step === LAST_STEP;

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 },
      ]}>
      <Animated.View
        key={step}
        entering={FadeIn.duration(resolveDuration(duration.state))}
        exiting={FadeOut.duration(resolveDuration(duration.press))}
        style={styles.content}>
        <Step />
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === step ? accent : color.edge,
                  width: index === step ? 16 : 6,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          {step > 0 ? (
            <View style={styles.backButton}>
              <Cta label={t('onboarding.back')} onPress={() => setStep(step - 1)} />
            </View>
          ) : null}
          <View style={styles.nextButton}>
            <Cta
              primary
              label={isLast ? t('onboarding.getStarted') : t('onboarding.next')}
              onPress={() => (isLast ? onDone() : setStep(step + 1))}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.background,
    paddingHorizontal: space.screen,
    justifyContent: 'space-between',
  },
  content: { flex: 1 },
  footer: { gap: 18 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: { height: 6, borderRadius: 3 },
  buttons: { flexDirection: 'row', gap: 10 },
  backButton: { flex: 1 },
  nextButton: { flex: 2 },
});
