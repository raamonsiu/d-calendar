import {
  StyleSheet,
  Text as RNText,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from 'react-native';

import { usePrefs } from './prefs';
import { TYPE_SCALE, color } from './tokens';

export type Weight = 300 | 400 | 500;

const SLAB: Record<Weight, string> = {
  300: 'RobotoSlab_300Light',
  400: 'RobotoSlab_400Regular',
  500: 'RobotoSlab_500Medium',
};

const MONO: Record<Weight, string> = {
  300: 'RobotoMono_300Light',
  400: 'RobotoMono_400Regular',
  500: 'RobotoMono_500Medium',
};

export function fontFamily(weight: Weight, mono: boolean) {
  return mono ? MONO[weight] : SLAB[weight];
}

/**
 * Devuelve el `fontSize` y el `lineHeight` del estilo ya escalados, para
 * aplicarlos como última capa. Así cada componente escribe los tamaños del
 * handoff y el ajuste global vive en un único token.
 */
export function scaleType(
  style: StyleProp<TextStyle>,
): TextStyle | undefined {
  if (TYPE_SCALE === 1) return undefined;
  const flat = StyleSheet.flatten(style);
  if (!flat) return undefined;

  const out: TextStyle = {};
  if (typeof flat.fontSize === 'number') out.fontSize = flat.fontSize * TYPE_SCALE;
  if (typeof flat.lineHeight === 'number')
    out.lineHeight = flat.lineHeight * TYPE_SCALE;

  return out.fontSize === undefined && out.lineHeight === undefined
    ? undefined
    : out;
}

type Props = TextProps & {
  /** Peso tipográfico; el diseño solo usa 300, 400 y 500. */
  w?: Weight;
  /** Fuerza Roboto Mono aunque la preferencia esté desactivada (logo, versiones). */
  mono?: boolean;
};

/**
 * Texto de la app. Aplica Roboto Slab (o Roboto Mono si el usuario lo activa
 * en Ajustes › Accesibilidad), el color de texto base y la escala global.
 */
export function T({ w = 300, mono, style, ...rest }: Props) {
  const prefs = usePrefs();
  return (
    <RNText
      {...rest}
      style={[
        styles.base,
        { fontFamily: fontFamily(w, mono ?? prefs.mono) },
        style,
        scaleType(style),
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: color.text,
    fontSize: 12.5 * TYPE_SCALE,
    // Roboto Slab tiene una caja alta; sin esto los números bailan en Android.
    includeFontPadding: false,
  },
});

/** Micro-etiqueta: 8.5–10px en MAYÚSCULAS con letterSpacing 1.1–1.8. */
export function Label({
  size = 9,
  tracking = 1.8,
  style,
  ...rest
}: Props & { size?: number; tracking?: number }) {
  return (
    <T
      w={rest.w ?? 300}
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
