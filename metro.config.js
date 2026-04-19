/**
 * Metro configuration for Client App (Standalone)
 * Configured for:
 * - Local packages resolution
 * - react-native-svg-transformer to support SVG imports
 */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Watch local packages
config.watchFolders = [
  path.resolve(__dirname, 'packages'),
];

// Configure SVG transformer
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...config.resolver,
  // Remove svg from asset extensions (so it's not treated as an image)
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  // Add svg to source extensions (so it can be imported as a component)
  sourceExts: [...config.resolver.sourceExts, 'svg'],
  // Resolve local packages
  extraNodeModules: {
    '@rentascooter/api': path.resolve(__dirname, 'packages/api'),
    '@rentascooter/auth': path.resolve(__dirname, 'packages/auth'),
    '@rentascooter/i18n': path.resolve(__dirname, 'packages/i18n'),
    '@rentascooter/onboarding': path.resolve(__dirname, 'packages/onboarding'),
    '@rentascooter/shared': path.resolve(__dirname, 'packages/shared'),
    '@rentascooter/ui': path.resolve(__dirname, 'packages/ui'),
  },
  nodeModulesPaths: [
    path.resolve(__dirname, 'node_modules'),
  ],
};

module.exports = config;
