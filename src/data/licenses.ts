/**
 * Open source dependencies the app ships, one entry per licence family.
 *
 * Read straight from each package's own `package.json` in `node_modules`, not
 * guessed: `license`, `repository`. Grouped where several packages come from
 * the same repository and carry the same licence, which is the whole Expo SDK
 * and the two font families — otherwise this would be thirty near-identical
 * rows instead of fourteen readable ones.
 *
 * There is no build step keeping this in sync with `package.json`: a
 * dependency added or removed has to be reflected here by hand.
 */

export type License = {
  name: string;
  license: string;
  url: string;
  /** What it is, or which packages this one row stands for. */
  note: string;
};

export const LICENSES: License[] = [
  {
    name: 'Expo SDK',
    license: 'MIT',
    url: 'https://github.com/expo/expo',
    note: 'expo, expo-router y el resto de módulos expo-*.',
  },
  {
    name: 'React',
    license: 'MIT',
    url: 'https://github.com/facebook/react',
    note: 'react, react-dom.',
  },
  {
    name: 'React Native',
    license: 'MIT',
    url: 'https://github.com/facebook/react-native',
    note: 'El framework sobre el que corre la app.',
  },
  {
    name: 'React Native Reanimated',
    license: 'MIT',
    url: 'https://github.com/software-mansion/react-native-reanimated',
    note: 'Animaciones, y react-native-worklets, del mismo proyecto.',
  },
  {
    name: 'React Native Gesture Handler',
    license: 'MIT',
    url: 'https://github.com/software-mansion/react-native-gesture-handler',
    note: 'Gestos de arrastre del menú lateral y las hojas.',
  },
  {
    name: 'React Native Screens',
    license: 'MIT',
    url: 'https://github.com/software-mansion/react-native-screens',
    note: 'Pantallas nativas para la navegación.',
  },
  {
    name: 'React Native SVG',
    license: 'MIT',
    url: 'https://github.com/react-native-community/react-native-svg',
    note: 'Base de los iconos.',
  },
  {
    name: 'React Native Safe Area Context',
    license: 'MIT',
    url: 'https://github.com/AppAndFlow/react-native-safe-area-context',
    note: 'Márgenes seguros en pantallas con muescas o barras del sistema.',
  },
  {
    name: 'React Native Web',
    license: 'MIT',
    url: 'https://github.com/necolas/react-native-web',
    note: 'Vista previa de la app en navegador durante el desarrollo.',
  },
  {
    name: 'Async Storage',
    license: 'MIT',
    url: 'https://github.com/react-native-async-storage/async-storage',
    note: 'Guarda en el teléfono lo que creas en la app.',
  },
  {
    name: 'Zustand',
    license: 'MIT',
    url: 'https://github.com/pmndrs/zustand',
    note: 'El estado de la app.',
  },
  {
    name: 'ical.js',
    license: 'MPL-2.0',
    url: 'https://github.com/kewisch/ical.js',
    note: 'Lee los archivos .ics de los calendarios por suscripción.',
  },
  {
    name: 'Phosphor Icons',
    license: 'MIT',
    url: 'https://github.com/duongdev/phosphor-react-native',
    note: 'Todos los iconos de la interfaz.',
  },
  {
    name: 'Roboto Slab y Roboto Mono',
    license: 'Apache-2.0 / OFL-1.1',
    url: 'https://github.com/expo/google-fonts',
    note: 'Las dos tipografías de la app, vía @expo-google-fonts.',
  },
];
