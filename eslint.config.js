/**
 * ESLint configuration (https://docs.expo.dev/guides/using-eslint/).
 *
 * It starts from Expo's own and disables exactly one rule, with a reason.
 */
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      /**
       * Reanimated shared values are mutable refs by design: they are written
       * from gestures and handlers, not only inside the effect that uses them.
       * The React compiler rule does not model them and reports false positives
       * in every animated component.
       */
      'react-hooks/immutability': 'off',
    },
  },
]);
