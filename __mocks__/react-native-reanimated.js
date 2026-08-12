/**
 * Manual jest mock of react-native-reanimated.
 *
 * The library's own mock.js still pulls in react-native-worklets, which tries
 * to reach a native module at import time and crashes under Jest with this
 * SDK 57 / Reanimated 4 pairing. Nothing under test here ever renders a
 * component or calls a worklet — these tests are the app's plain TypeScript
 * decision functions — so this stands in with just enough surface for the
 * import chain to resolve: `View`/`ScrollView` as the plain React Native ones,
 * everything else as a function that does nothing.
 */
const { View, ScrollView } = require('react-native');

const noop = () => {};
const identity = (value) => value;

module.exports = {
  __esModule: true,
  default: { View, ScrollView },
  Easing: {
    linear: identity,
    bezier: () => identity,
  },
  cancelAnimation: noop,
  runOnJS: (fn) => fn,
  useAnimatedScrollHandler: () => noop,
  useAnimatedStyle: (factory) => (typeof factory === 'function' ? factory() : {}),
  useSharedValue: (initial) => ({ value: initial }),
  withRepeat: identity,
  withSequence: identity,
  withTiming: identity,
  FadeIn: { duration: () => ({}) },
  FadeInDown: { duration: () => ({}) },
  FadeOut: { duration: () => ({}) },
  FadeOutDown: { duration: () => ({}) },
};
