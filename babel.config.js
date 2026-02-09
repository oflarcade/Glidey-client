/**
 * Babel configuration for Client App
 * Includes react-native-reanimated plugin for animations
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-reanimated/plugin must be listed last
      'react-native-reanimated/plugin',
    ],
  };
};
