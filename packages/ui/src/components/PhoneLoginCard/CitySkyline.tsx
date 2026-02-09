import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { primaryColors } from '../../theme';

interface CitySkylineProps {
  width?: number;
  height?: number;
}

export function CitySkyline({ width = 345, height = 80 }: CitySkylineProps) {
  const aspectRatio = width / 345;
  const scaledHeight = height;

  return (
    <View style={[styles.container, { height: scaledHeight }]}>
      <Svg
        width="100%"
        height={scaledHeight}
        viewBox={`0 0 345 ${height}`}
        preserveAspectRatio="xMidYMax slice"
      >
        {/* Background gradient - using golden yellow */}
        <Rect x="0" y="0" width="345" height={height} fill={primaryColors[400]} />
        
        {/* Skyline silhouette - simplified city buildings */}
        <G fill={primaryColors[300]} opacity={0.6}>
          {/* Left buildings group */}
          <Rect x="10" y={height - 35} width="12" height="35" />
          <Rect x="25" y={height - 50} width="15" height="50" />
          <Rect x="42" y={height - 40} width="10" height="40" />
          <Rect x="55" y={height - 55} width="18" height="55" />
          
          {/* Center-left buildings */}
          <Rect x="80" y={height - 45} width="14" height="45" />
          <Rect x="96" y={height - 60} width="12" height="60" />
          <Rect x="110" y={height - 35} width="16" height="35" />
          
          {/* Center buildings - taller */}
          <Rect x="130" y={height - 70} width="20" height="70" />
          <Rect x="152" y={height - 55} width="14" height="55" />
          <Rect x="168" y={height - 65} width="18" height="65" />
          <Rect x="188" y={height - 50} width="12" height="50" />
          
          {/* Center-right buildings */}
          <Rect x="205" y={height - 58} width="16" height="58" />
          <Rect x="223" y={height - 42} width="14" height="42" />
          <Rect x="239" y={height - 52} width="18" height="52" />
          
          {/* Right buildings group */}
          <Rect x="260" y={height - 38} width="12" height="38" />
          <Rect x="274" y={height - 48} width="16" height="48" />
          <Rect x="292" y={height - 42} width="14" height="42" />
          <Rect x="308" y={height - 55} width="12" height="55" />
          <Rect x="322" y={height - 35} width="15" height="35" />
        </G>
        
        {/* Building windows - small rectangles for detail */}
        <G fill={primaryColors[200]} opacity={0.4}>
          {/* Windows on taller buildings */}
          <Rect x="133" y={height - 60} width="4" height="4" />
          <Rect x="140" y={height - 60} width="4" height="4" />
          <Rect x="133" y={height - 50} width="4" height="4" />
          <Rect x="140" y={height - 50} width="4" height="4" />
          <Rect x="133" y={height - 40} width="4" height="4" />
          <Rect x="140" y={height - 40} width="4" height="4" />
          
          <Rect x="171" y={height - 55} width="4" height="4" />
          <Rect x="178" y={height - 55} width="4" height="4" />
          <Rect x="171" y={height - 45} width="4" height="4" />
          <Rect x="178" y={height - 45} width="4" height="4" />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
});
