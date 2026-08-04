import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import {
  Easing,
  runOnJS,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useDuration } from '@/theme/prefs';
import { EASE_OUT, duration } from '@/theme/tokens';

/**
 * Entrada y salida de un panel (drawer o bottom sheet): mantiene el contenido
 * montado mientras dura la animación de cierre y cierra con el botón atrás.
 *
 * `progress` va de 0 a 1 y es lo que consumen los `useAnimatedStyle`.
 */
export function usePanelTransition(open: boolean, onClose: () => void) {
  const dur = useDuration();
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    if (!mounted) return;
    const easing = Easing.bezier(...EASE_OUT);
    if (open) {
      progress.value = withTiming(1, { duration: dur(duration.panel), easing });
      return;
    }
    progress.value = withTiming(
      0,
      { duration: dur(duration.panel), easing },
      (finished) => {
        if (finished) runOnJS(setMounted)(false);
      },
    );
  }, [open, mounted, dur, progress]);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [open, onClose]);

  return { mounted, progress };
}
