import '@testing-library/jest-native/extend-expect';

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {
    View: require('react-native').View,
  },
  useSharedValue: (value: number) => ({ value }),
  useAnimatedStyle: () => ({}),
  withSpring: (value: number) => value,
  runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
}));

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  return {
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    Gesture: {
      Pan: () => ({
        onUpdate: () => ({ onEnd: () => ({}) }),
      }),
    },
  };
});

jest.mock('@rnmapbox/maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      Camera: View,
      MarkerView: ({ children }: { children: React.ReactNode }) => children,
    },
  };
});
