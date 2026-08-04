import { useEffect, type ReactNode } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Label } from '@/theme/Text';
import { useDuration } from '@/theme/prefs';
import { color } from '@/theme/tokens';
import { XIcon } from './icons';
import { usePanelTransition } from './usePanelTransition';

/** Aire entre el sheet y el teclado cuando está abierto. */
const KEYBOARD_GAP = 16;

type Props = {
  open: boolean;
  onClose: () => void;
  /** Micro-etiqueta de la cabecera, que además es la zona de arrastre. */
  title?: string;
  children: ReactNode;
};

/**
 * Bottom sheet del diseño: tarjeta flotante separada 10px de los bordes,
 * radio 28, overlay negro al 55%. Se monta dentro de la pantalla (no en un
 * Modal) para que quede exactamente como el prototipo.
 *
 * El gesto de cierre vive solo en la cabecera: si cubriera toda la tarjeta
 * competiría con los scrolls internos (ruedas de hora, changelog).
 */
export function Sheet({ open, onClose, title, children }: Props) {
  const dur = useDuration();
  const insets = useSafeAreaInsets();
  const { mounted, progress } = usePanelTransition(open, onClose);

  const sheetH = useSharedValue(600);
  const drag = useSharedValue(0);
  const keyboard = useSharedValue(0);

  // La app dibuja edge-to-edge, así que la ventana no se redimensiona sola:
  // el sheet sube con el teclado a mano.
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(
      ios ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const lift =
          Math.max(0, e.endCoordinates.height - insets.bottom) + KEYBOARD_GAP;
        keyboard.value = withTiming(lift, { duration: dur(220) });
      },
    );
    const hide = Keyboard.addListener(
      ios ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        keyboard.value = withTiming(0, { duration: dur(180) });
      },
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [insets.bottom, keyboard, dur]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.55,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY:
          (1 - progress.value) * (sheetH.value + 24) +
          drag.value -
          keyboard.value,
      },
    ],
  }));

  const pan = Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetY(-10)
    .onChange((e) => {
      drag.value = Math.max(0, drag.value + e.changeY);
    })
    .onEnd((e) => {
      const shouldClose = drag.value > 90 || e.velocityY > 800;
      // Siempre vuelve a 0: al reabrir, el sheet parte de su sitio.
      drag.value = withTiming(0, { duration: 180 });
      if (shouldClose) runOnJS(onClose)();
    });

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable
        accessibilityLabel="Cerrar"
        onPress={onClose}
        style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
        />
      </Pressable>

      <Animated.View
        onLayout={(e) => {
          sheetH.value = e.nativeEvent.layout.height;
        }}
        style={[
          styles.sheet,
          { bottom: Math.max(10, insets.bottom) },
          sheetStyle,
        ]}>
        {title ? (
          <GestureDetector gesture={pan}>
            <View style={styles.header}>
              <Label>{title}</Label>
              <Pressable
                accessibilityLabel="Cerrar"
                hitSlop={9}
                onPress={onClose}
                style={styles.close}>
                <XIcon size={13} color={color.label} />
              </Pressable>
            </View>
          </GestureDetector>
        ) : null}
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: '#000' },
  sheet: {
    position: 'absolute',
    left: 10,
    right: 10,
    backgroundColor: color.surface,
    borderRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 12,
  },
  header: {
    // Se come el padding superior del sheet para que la zona de arrastre
    // abarque también ese aire, no solo la altura del texto.
    marginTop: -16,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  close: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
