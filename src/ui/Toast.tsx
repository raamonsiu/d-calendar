import { useFocusEffect } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutDown,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toastRemainingShare } from '@/lib/toast';
import { AppText } from '@/theme/Text';
import { useAccent, useDuration, usePrefs } from '@/theme/prefs';
import { EASE_OUT, color, duration, layer, radius, tint } from '@/theme/tokens';

type ToastMessage = {
  /** Tells one toast from the next, even when the text is the same. */
  id: number;
  /** Instant it was shown, which the countdown bar is measured from. */
  shownAt: number;
  message: string;
  onUndo?: () => void;
};

type ToastApi = {
  /** Plain toast; it goes away on its own. */
  show: (message: string) => void;
  /** Toast with "DESHACER" for as long as it stays on screen. */
  showUndo: (message: string, onUndo: () => void) => void;
};

/**
 * What `ToastSlot` needs from the provider: the toast on screen, the way to
 * undo it, and the way to say "I am on screen, draw it here".
 */
type ToastHost = {
  toast: ToastMessage | null;
  undo: () => void;
  registerSlot: () => () => void;
};

/** How long a toast stays on screen, and with it the window to undo. */
const TOAST_MS = 5000;

/** Height of the countdown bar along the bottom edge of a toast. */
const COUNTDOWN_HEIGHT = 3;

const ToastContext = createContext<ToastApi>({
  show: () => {},
  showUndo: () => {},
});

const ToastHostContext = createContext<ToastHost>({
  toast: null,
  undo: () => {},
  registerSlot: () => () => {},
});

export const useToast = () => useContext(ToastContext);

/**
 * Toasts of the app. There is only ever one at a time: a new one replaces the
 * previous one, same as in the prototype.
 *
 * It is mounted above the whole navigator, so a toast survives a screen change
 * and undo keeps working after going back.
 *
 * It is drawn in the `ToastSlot` of the screen in view, in flow, growing between
 * the components around it so it never covers the button or the list under it.
 * Home, the form and the secondary screens all have one. Only a screen without
 * a slot gets the toast floating over its bottom edge instead.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [slots, setSlots] = useState(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);
  const insets = useSafeAreaInsets();
  const { motionOff } = usePrefs();

  const clearTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }, []);

  const showToast = useCallback(
    (next: Pick<ToastMessage, 'message' | 'onUndo'>) => {
      clearTimer();
      nextId.current += 1;
      setToast({ ...next, id: nextId.current, shownAt: Date.now() });
      hideTimer.current = setTimeout(() => setToast(null), TOAST_MS);
    },
    [clearTimer],
  );

  const undo = useCallback(() => {
    toast?.onUndo?.();
    clearTimer();
    setToast(null);
  }, [toast, clearTimer]);

  const registerSlot = useCallback(() => {
    setSlots((current) => current + 1);
    return () => setSlots((current) => current - 1);
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const api = useMemo<ToastApi>(
    () => ({
      show: (message) => showToast({ message }),
      showUndo: (message, onUndo) => showToast({ message, onUndo }),
    }),
    [showToast],
  );

  const host = useMemo<ToastHost>(
    () => ({ toast, undo, registerSlot }),
    [toast, undo, registerSlot],
  );

  return (
    <ToastContext.Provider value={api}>
      <ToastHostContext.Provider value={host}>
        {children}
        {toast && slots === 0 ? (
          <View
            pointerEvents="box-none"
            style={[styles.wrap, { paddingBottom: Math.max(12, insets.bottom) }]}>
            <Animated.View
              entering={
                motionOff ? undefined : FadeInDown.duration(duration.state)
              }
              exiting={
                motionOff ? undefined : FadeOutDown.duration(duration.press)
              }>
              <ToastBar key={toast.id} toast={toast} onUndo={undo} />
            </Animated.View>
          </View>
        ) : null}
      </ToastHostContext.Provider>
    </ToastContext.Provider>
  );
}

/**
 * Place of the toast inside a screen's layout.
 *
 * It takes no room while there is no toast. When one appears it grows to the
 * toast's height, pushing the components around it aside, and when the toast
 * leaves it shrinks back, so what was moved glides home instead of jumping.
 * While the screen is not the one in view it stays out of the way and the
 * toast floats instead.
 *
 * Put it as a child of a container that spaces its children with `gap`, and
 * pass that same gap: the slot cancels it out while closed, so the layout is
 * the one it had before the slot was there.
 *
 * @param gap Gap the parent container puts between its children.
 */
export function ToastSlot({ gap }: { gap: number }) {
  const { toast, undo, registerSlot } = useContext(ToastHostContext);
  const resolveDuration = useDuration();

  useFocusEffect(useCallback(() => registerSlot(), [registerSlot]));

  /**
   * The last toast, kept while the slot closes: the content has to stay on
   * screen for as long as the room it occupies takes to shrink.
   */
  const [shown, setShown] = useState(toast);
  if (toast && toast !== shown) setShown(toast);

  const [contentHeight, setContentHeight] = useState(0);
  const open = useSharedValue(0);
  const isOpen = toast !== null && contentHeight > 0;

  useEffect(() => {
    open.value = withTiming(isOpen ? 1 : 0, {
      duration: resolveDuration(duration.panel),
      easing: Easing.bezier(...EASE_OUT),
    });
  }, [isOpen, open, resolveDuration]);

  const roomStyle = useAnimatedStyle(() => ({
    height: open.value * contentHeight,
    marginTop: -gap * (1 - open.value),
    opacity: open.value,
  }));

  return (
    <Animated.View
      pointerEvents={toast ? 'auto' : 'none'}
      accessibilityElementsHidden={!toast}
      importantForAccessibility={toast ? 'auto' : 'no-hide-descendants'}
      style={[styles.slot, roomStyle]}>
      {shown ? (
        <View
          style={styles.slotContent}
          onLayout={(event) =>
            setContentHeight(event.nativeEvent.layout.height)
          }>
          <ToastBar key={shown.id} toast={shown} onUndo={undo} />
        </View>
      ) : null}
    </Animated.View>
  );
}

/**
 * The toast itself: message, "DESHACER" when there is something to undo, and
 * along its bottom edge a bar crossing the whole toast that shrinks and fades
 * as the toast runs out of time.
 *
 * The bar starts from what is left of the toast's life and not from full, so
 * a toast drawn again somewhere else keeps counting where it was.
 */
function ToastBar({
  toast,
  onUndo,
}: {
  toast: ToastMessage;
  onUndo: () => void;
}) {
  const { t } = useTranslation();
  const accent = useAccent();
  const remaining = useSharedValue(1);

  useEffect(() => {
    const left = toastRemainingShare(toast.shownAt, Date.now(), TOAST_MS);
    remaining.value = left;
    remaining.value = withTiming(0, {
      duration: left * TOAST_MS,
      easing: Easing.linear,
    });
    return () => cancelAnimation(remaining);
  }, [toast.shownAt, remaining]);

  const countdownStyle = useAnimatedStyle(() => ({
    width: `${remaining.value * 100}%`,
    opacity: remaining.value * tint.countdown,
  }));

  return (
    <View style={styles.bar}>
      <AppText
        numberOfLines={1}
        accessibilityLiveRegion="polite"
        style={styles.message}>
        {toast.message}
      </AppText>
      {toast.onUndo ? (
        <Pressable accessibilityRole="button" hitSlop={10} onPress={onUndo}>
          <AppText weight={500} style={[styles.undo, { color: accent }]}>
            {t('common.undo')}
          </AppText>
        </Pressable>
      ) : null}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.countdown,
          { backgroundColor: accent },
          countdownStyle,
        ]}
      />
    </View>
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
  slot: { overflow: 'hidden' },
  /**
   * Out of flow on purpose: the slot's own height is the animated one, and
   * the toast's natural height is read from here.
   */
  slotContent: { position: 'absolute', top: 0, left: 0, right: 0 },
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
    overflow: 'hidden',
  },
  message: { flex: 1, fontSize: 12, color: color.textBody },
  undo: { fontSize: 9.5, letterSpacing: 1.4 },
  countdown: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: COUNTDOWN_HEIGHT,
  },
});
