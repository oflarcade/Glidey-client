/**
 * TypeScript declaration for SVG imports
 *
 * Enables importing SVG files as React components via react-native-svg-transformer
 * @see https://github.com/kristerkari/react-native-svg-transformer
 */
declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
