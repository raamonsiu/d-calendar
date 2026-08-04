import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { color, duration, layer, radius } from '@/theme/tokens';

type ToastMessage = { message: string; onUndo?: () => void };

type ToastApi = {
  /** Plain toast; it goes away on its own. */
  show: (message: string) => void;
  /** Toast with "DESHACER" for as long as it stays on screen. */
  showUndo: (message: string, onUndo: () => void) => void;
};

/** How long a toast stays on screen, and with it the window to undo. */
const TOAST_MS = 5000;

const ToastContext = createContext<ToastApi>({
  show: () => {},
  showUndo: () => {},
});

export const useToast = () => useContext(ToastContext);

/**
 * Bottom toasts of the app. There is only ever one at a time: a new one
 * replaces the previous one, same as in the prototype.
 *
 * It is mounted above the whole navigator, so a toast survives a screen change
 * and undo keeps working after going back.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const { motionOff } = usePrefs();

  const clearTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }, []);

  const showToast = useCallback(
    (next: ToastMessage) => {
      clearTimer();
      setToast(next);
      hideTimer.current = setTimeout(() => setToast(null), TOAST_MS);
    },
    [clearTimer],
  );

  useEffect(() => clearTimer, [clearTimer]);

  const api: ToastApi = {
    show: (message) => showToast({ message }),
    showUndo: (message, onUndo) => showToast({ message, onUndo }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <View
          pointerEvents="box-none"
          style={[styles.wrap, { paddingBottom: Math.max(12, insets.bottom) }]}>
          <Animated.View
            entering={
              motionOff ? undefined : FadeInDown.duration(duration.state)
            }
            exiting={motionOff ? undefined : FadeOutDown.duration(duration.press)}
            style={styles.bar}>
            <AppText numberOfLines={1} style={styles.message}>
              {toast.message}
            </AppText>
            {toast.onUndo ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => {
                  toast.onUndo?.();
                  clearTimer();
                  setToast(null);
                }}>
                <AppText weight={500} style={[styles.undo, { color: accent }]}>
                  DESHACER
                </AppText>
              </Pressable>
            ) : null}
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    zIndex: layer.toast,
  },
  bar: {
    minHeight: 46,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  message: { flex: 1, fontSize: 12, color: color.textBody },
  undo: { fontSize: 9.5, letterSpacing: 1.4 },
});
