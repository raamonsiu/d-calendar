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
 * Entrance and exit of a panel (side menu or bottom sheet).
 *
 * It solves the two things both panels need the same way: keeping the content
 * mounted while the closing animation runs, and closing with the Android back
 * button.
 *
 * Precondition: the caller stops drawing the panel once `mounted` is false.
 * Postcondition: `progress` goes from 0 (out) to 1 (in) and is what the panel's
 * `useAnimatedStyle` hooks consume. Under the "Reducir animaciones" setting the
 * jump is immediate because the duration becomes 0.
 *
 * @param open Whether the panel should be open.
 * @param onClose What to do when closing is requested from the back button.
 */
export function usePanelTransition(open: boolean, onClose: () => void) {
  const resolveDuration = useDuration();

  /**
   * It mounts in the same render that requests opening (derived state) so the
   * entrance animation starts without a blank frame.
   */
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    if (!mounted) return;

    const timing = {
      duration: resolveDuration(duration.panel),
      easing: Easing.bezier(...EASE_OUT),
    };

    if (open) {
      progress.value = withTiming(1, timing);
      return;
    }

    progress.value = withTiming(0, timing, (finished) => {
      if (finished) runOnJS(setMounted)(false);
    });
  }, [open, mounted, resolveDuration, progress]);

  useEffect(() => {
    if (!open) return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onClose();
        return true;
      },
    );
    return () => subscription.remove();
  }, [open, onClose]);

  return { mounted, progress };
}
