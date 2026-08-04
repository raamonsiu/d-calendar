/**
 * `phosphor-react-native` se importa desde su fuente (`src/icons/*`) para no
 * arrastrar los ~1500 iconos al bundle, y su `IconBase` pasa `className` al
 * `<Svg>`, que react-native-svg no declara. Se añade aquí para que el
 * typecheck del proyecto no falle por un archivo de terceros.
 */
export {};

declare module 'react-native-svg/lib/typescript/elements/Svg' {
  interface SvgProps {
    className?: string;
  }
}
