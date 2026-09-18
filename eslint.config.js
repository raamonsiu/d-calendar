/**
 * ESLint configuration (https://docs.expo.dev/guides/using-eslint/).
 *
 * It starts from Expo's own, disables one rule and relaxes another for a single
 * file, each with a reason.
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
  {
    files: ['src/services/notifications.ts'],
    rules: {
      /**
       * This file loads `expo-notifications` with `require` on purpose, behind
       * a check: evaluating the package inside Expo Go throws, and a static
       * `import` cannot be made conditional. Only that one package is let
       * through.
       */
      '@typescript-eslint/no-require-imports': [
        'error',
        { allow: ['^expo-notifications$'] },
      ],
    },
  },
]);
