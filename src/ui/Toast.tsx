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

import { T } from '@/theme/Text';
import { useAccent, usePrefs } from '@/theme/prefs';
import { color } from '@/theme/tokens';

type Toast = { message: string; onUndo?: () => void };

type ToastApi = {
  /** Aviso con «DESHACER» durante 5 s (el que pide el artículo de ayuda). */
  showUndo: (message: string, onUndo: () => void) => void;
  show: (message: string) => void;
};

const ToastContext = createContext<ToastApi>({ showUndo: () => {}, show: () => {} });

export const useToast = () => useContext(ToastContext);

const UNDO_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const accent = useAccent();
  const { motionOff } = usePrefs();

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const push = useCallback(
    (next: Toast) => {
      clear();
      setToast(next);
      timer.current = setTimeout(() => setToast(null), UNDO_MS);
    },
    [clear],
  );

  useEffect(() => clear, [clear]);

  const api: ToastApi = {
    show: (message) => push({ message }),
    showUndo: (message, onUndo) => push({ message, onUndo }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <View
          pointerEvents="box-none"
          style={[styles.wrap, { paddingBottom: Math.max(12, insets.bottom) }]}>
          <Animated.View
            entering={motionOff ? undefined : FadeInDown.duration(220)}
            exiting={motionOff ? undefined : FadeOutDown.duration(180)}
            style={styles.bar}>
            <T numberOfLines={1} style={styles.message}>
              {toast.message}
            </T>
            {toast.onUndo ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => {
                  toast.onUndo?.();
                  clear();
                  setToast(null);
                }}>
                <T w={500} style={[styles.undo, { color: accent }]}>
                  DESHACER
                </T>
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
    zIndex: 40,
  },
  bar: {
    minHeight: 46,
    borderRadius: 18,
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
