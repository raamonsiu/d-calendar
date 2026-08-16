import {
  StyleSheet,
  Text as ReactNativeText,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from 'react-native';

import { usePrefs } from './prefs';
import { CONTRAST_LIFT, TYPE_SCALE, color } from './tokens';

/** The design only uses these three weights. */
export type FontWeight = 300 | 400 | 500;

const SLAB_FAMILIES: Record<FontWeight, string> = {
  300: 'RobotoSlab_300Light',
  400: 'RobotoSlab_400Regular',
  500: 'RobotoSlab_500Medium',
};

const MONO_FAMILIES: Record<FontWeight, string> = {
  300: 'RobotoMono_300Light',
  400: 'RobotoMono_400Regular',
  500: 'RobotoMono_500Medium',
};

/**
 * Resolves the font family that applies.
 *
 * Precondition: `weight` is one of the three weights loaded in `_layout.tsx`.
 * Postcondition: returns the family name exactly as `useFonts` registered it,
 * never an empty string.
 *
 * @param weight Requested font weight.
 * @param mono true for Roboto Mono, false for Roboto Slab.
 */
export function fontFamily(weight: FontWeight, mono: boolean) {
  return mono ? MONO_FAMILIES[weight] : SLAB_FAMILIES[weight];
}

/**
 * The last style layer of a piece of text: the global type scale, and the
 * brighter colour when the user asked for more contrast.
 *
 * Both are worked out here, from the already resolved style, so they can be
 * placed at the end of the style array and win over whatever the component
 * wrote. That is what lets every screen keep writing the handoff sizes and
 * the palette names, with the two global adjustments living in one token
 * each.
 *
 * Precondition: none; it accepts nested, null or empty styles.
 * Postcondition: returns `undefined` when there is nothing to change, and
 * otherwise an object holding only the properties that do change. A colour
 * the lift does not know about is left exactly as it was.
 *
 * @param style Style the sizes and the colour are read from.
 * @param highContrast Whether the accessibility preference is on.
 */
export function textOverrides(
  style: StyleProp<TextStyle>,
  highContrast: boolean,
): TextStyle | undefined {
  const flattened = StyleSheet.flatten(style);
  if (!flattened) return undefined;

  const overrides: TextStyle = {};

  if (TYPE_SCALE !== 1) {
    if (typeof flattened.fontSize === 'number') {
      overrides.fontSize = flattened.fontSize * TYPE_SCALE;
    }
    if (typeof flattened.lineHeight === 'number') {
      overrides.lineHeight = flattened.lineHeight * TYPE_SCALE;
    }
  }

  if (highContrast && typeof flattened.color === 'string') {
    const lifted = CONTRAST_LIFT[flattened.color];
    if (lifted) overrides.color = lifted;
  }

  return Object.keys(overrides).length === 0 ? undefined : overrides;
}

type AppTextProps = TextProps & {
  /** Font weight; the design only uses 300, 400 and 500. */
  weight?: FontWeight;
  /** Forces Roboto Mono even when the preference is off (logo, versions). */
  mono?: boolean;
};

/**
 * Every piece of text in the app. Resolves the family (Roboto Slab, or Roboto
 * Mono when the user turns the preference on in Settings › Accesibilidad), the
 * base colour and the global type scale.
 */
export function AppText({
  weight = 300,
  mono,
  style,
  ...rest
}: AppTextProps) {
  const prefs = usePrefs();
  return (
    <ReactNativeText
      {...rest}
      style={[
        styles.base,
        { fontFamily: fontFamily(weight, mono ?? prefs.mono) },
        style,
        textOverrides(style, prefs.highContrast),
      ]}
    />
  );
}

/**
 * Micro label from the design: 8.5-10px uppercase with letterSpacing 1.1-1.8.
 * It is an `AppText` with the style already applied, so it takes the same
 * props.
 */
export function Label({
  size = 9,
  tracking = 1.8,
  style,
  ...rest
}: AppTextProps & { size?: number; tracking?: number }) {
  return (
    <AppText
      weight={rest.weight ?? 300}
      {...rest}
      style={[
        {
          fontSize: size,
          letterSpacing: tracking,
          color: color.label,
          textTransform: 'uppercase',
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: color.text,
    fontSize: 12.5 * TYPE_SCALE,
    /**
     * Roboto Slab has a tall box: without this the numbers jitter on Android.
     */
    includeFontPadding: false,
  },
});
