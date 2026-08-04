import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { fontFamily, scaleType } from '@/theme/Text';
import { usePrefs } from '@/theme/prefs';
import { color, radius } from '@/theme/tokens';

type Props = TextInputProps & {
  /** `boxed` pinta el control (borde + superficie); `bare` va dentro de una caja. */
  variant?: 'boxed' | 'bare';
  size?: number;
};

export function Field({
  variant = 'boxed',
  size = 12.5,
  style,
  ...rest
}: Props) {
  const { mono } = usePrefs();
  return (
    <TextInput
      placeholderTextColor={color.ghost}
      cursorColor={color.text}
      selectionColor={color.border}
      {...rest}
      style={[
        styles.base,
        { fontFamily: fontFamily(300, mono), fontSize: size },
        variant === 'boxed' && styles.boxed,
        style,
        // Misma escala global que <T>.
        scaleType([{ fontSize: size }, style]),
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: color.text,
    padding: 0,
    includeFontPadding: false,
  },
  boxed: {
    height: 40,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.card,
    paddingHorizontal: 12,
  },
});
