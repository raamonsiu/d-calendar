// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // Los shared values de Reanimated son refs mutables por diseño: se
      // escriben desde gestos y handlers, no solo dentro del efecto que los
      // usa. La regla del compilador no los modela y da falsos positivos.
      "react-hooks/immutability": "off",
    },
  },
]);
