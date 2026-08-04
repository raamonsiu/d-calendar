/**
 * `phosphor-react-native` is imported from its source (`src/icons/*`) so the
 * ~1500 icons do not end up in the bundle, and its `IconBase` passes
 * `className` down to `<Svg>`, which react-native-svg does not declare. It is
 * added here so the project typecheck does not fail because of a third party
 * file.
 */
export {};

declare module 'react-native-svg/lib/typescript/elements/Svg' {
  interface SvgProps {
    className?: string;
  }
}
