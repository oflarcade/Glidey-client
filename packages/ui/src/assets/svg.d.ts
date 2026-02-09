/**
 * TypeScript declaration for SVG imports
 * Used with react-native-svg-transformer
 * 
 * Apps using this package need to configure metro.config.js:
 * 
 * ```js
 * const { getDefaultConfig } = require('expo/metro-config');
 * const config = getDefaultConfig(__dirname);
 * 
 * config.transformer = {
 *   ...config.transformer,
 *   babelTransformerPath: require.resolve('react-native-svg-transformer'),
 * };
 * 
 * config.resolver = {
 *   ...config.resolver,
 *   assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
 *   sourceExts: [...config.resolver.sourceExts, 'svg'],
 * };
 * 
 * module.exports = config;
 * ```
 */
declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
