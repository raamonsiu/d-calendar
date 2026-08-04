import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { fontFamily, scaleType } from '@/theme/Text';
import { usePrefs } from '@/theme/prefs';
import { color, radius } from '@/theme/tokens';

type FieldProps = TextInputProps & {
  /**
   * `boxed` draws the control (border and surface); `bare` goes inside a box.
   */
  variant?: 'boxed' | 'bare';
  fontSize?: number;
};

/**
 * Text field of the app. Resolves the font family and the global scale just
 * like `<AppText>`, and in the `boxed` variant it adds the full control.
 */
export function Field({
  variant = 'boxed',
  fontSize = 12.5,
  style,
  ...rest
}: FieldProps) {
  const { mono } = usePrefs();
  return (
    <TextInput
      placeholderTextColor={color.ghost}
      cursorColor={color.text}
      selectionColor={color.border}
      {...rest}
      style={[
        styles.base,
        { fontFamily: fontFamily(300, mono), fontSize },
        variant === 'boxed' && styles.boxed,
        style,
        scaleType([{ fontSize }, style]),
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
