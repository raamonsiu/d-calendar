/**
 * Open source dependencies the app ships, one entry per licence family.
 *
 * Read straight from each package's own `package.json` in `node_modules`, not
 * guessed: `license`, `repository`. Grouped where several packages come from
 * the same repository and carry the same licence, which is the whole Expo SDK
 * and the two font families: otherwise this would be thirty near-identical
 * rows instead of fourteen readable ones.
 *
 * There is no build step keeping this in sync with `package.json`: a
 * dependency added or removed has to be reflected here by hand.
 */
import type { Language } from '@/lib/language';

export type License = {
  name: string;
  license: string;
  url: string;
  /** What it is, or which packages this one row stands for. */
  note: Record<Language, string>;
};

export const LICENSES: License[] = [
  {
    name: 'Expo SDK',
    license: 'MIT',
    url: 'https://github.com/expo/expo',
    note: {
      es: 'expo, expo-router y el resto de módulos expo-*.',
      en: 'expo, expo-router and the rest of the expo-* modules.',
      ca: 'expo, expo-router i la resta de mòduls expo-*.',
    },
  },
  {
    name: 'React',
    license: 'MIT',
    url: 'https://github.com/facebook/react',
    note: {
      es: 'react, react-dom.',
      en: 'react, react-dom.',
      ca: 'react, react-dom.',
    },
  },
  {
    name: 'React Native',
    license: 'MIT',
    url: 'https://github.com/facebook/react-native',
    note: {
      es: 'El framework sobre el que corre la app.',
      en: 'The framework the app runs on.',
      ca: "El framework sobre el qual funciona l'app.",
    },
  },
  {
    name: 'React Native Reanimated',
    license: 'MIT',
    url: 'https://github.com/software-mansion/react-native-reanimated',
    note: {
      es: 'Animaciones, y react-native-worklets, del mismo proyecto.',
      en: 'Animations, and react-native-worklets, from the same project.',
      ca: 'Animacions, i react-native-worklets, del mateix projecte.',
    },
  },
  {
    name: 'React Native Gesture Handler',
    license: 'MIT',
    url: 'https://github.com/software-mansion/react-native-gesture-handler',
    note: {
      es: 'Gestos de arrastre del menú lateral y las hojas.',
      en: 'Drag gestures of the side menu and the sheets.',
      ca: "Gestos d'arrossegament del menú lateral i els fulls.",
    },
  },
  {
    name: 'React Native Screens',
    license: 'MIT',
    url: 'https://github.com/software-mansion/react-native-screens',
    note: {
      es: 'Pantallas nativas para la navegación.',
      en: 'Native screens for the navigation.',
      ca: 'Pantalles natives per a la navegació.',
    },
  },
  {
    name: 'React Native SVG',
    license: 'MIT',
    url: 'https://github.com/react-native-community/react-native-svg',
    note: {
      es: 'Base de los iconos.',
      en: 'What the icons are built on.',
      ca: 'Base de les icones.',
    },
  },
  {
    name: 'React Native Safe Area Context',
    license: 'MIT',
    url: 'https://github.com/AppAndFlow/react-native-safe-area-context',
    note: {
      es: 'Márgenes seguros en pantallas con muescas o barras del sistema.',
      en: 'Safe margins on screens with notches or system bars.',
      ca: 'Marges segurs en pantalles amb osques o barres del sistema.',
    },
  },
  {
    name: 'React Native Web',
    license: 'MIT',
    url: 'https://github.com/necolas/react-native-web',
    note: {
      es: 'Vista previa de la app en navegador durante el desarrollo.',
      en: 'Preview of the app in a browser while developing.',
      ca: "Vista prèvia de l'app al navegador durant el desenvolupament.",
    },
  },
  {
    name: 'Async Storage',
    license: 'MIT',
    url: 'https://github.com/react-native-async-storage/async-storage',
    note: {
      es: 'Guarda en el teléfono lo que creas en la app.',
      en: 'Stores on the phone whatever you create in the app.',
      ca: "Desa al telèfon el que crees a l'app.",
    },
  },
  {
    name: 'Zustand',
    license: 'MIT',
    url: 'https://github.com/pmndrs/zustand',
    note: {
      es: 'El estado de la app.',
      en: 'The state of the app.',
      ca: "L'estat de l'app.",
    },
  },
  {
    name: 'ical.js',
    license: 'MPL-2.0',
    url: 'https://github.com/kewisch/ical.js',
    note: {
      es: 'Lee los archivos .ics de los calendarios por suscripción.',
      en: 'Reads the .ics files of the subscribed calendars.',
      ca: 'Llegeix els fitxers .ics dels calendaris per subscripció.',
    },
  },
  {
    name: 'Phosphor Icons',
    license: 'MIT',
    url: 'https://github.com/duongdev/phosphor-react-native',
    note: {
      es: 'Todos los iconos de la interfaz.',
      en: 'Every icon in the interface.',
      ca: 'Totes les icones de la interfície.',
    },
  },
  {
    name: 'Roboto Slab y Roboto Mono',
    license: 'Apache-2.0 / OFL-1.1',
    url: 'https://github.com/expo/google-fonts',
    note: {
      es: 'Las dos tipografías de la app, vía @expo-google-fonts.',
      en: "The app's two typefaces, through @expo-google-fonts.",
      ca: "Les dues tipografies de l'app, via @expo-google-fonts.",
    },
  },
];
