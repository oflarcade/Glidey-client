import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { legacyColors as colors, spacing, typography } from '../../theme';
import { Text } from '../Text';

/**
 * @description Props for the AppBrandHeader component
 *
 * @acceptance AC-ABH-001: Displays app name in brand typography
 * @acceptance AC-ABH-002: Uses primary brand color for text
 * @acceptance AC-ABH-003: Letter spacing creates modern look
 * @acceptance AC-ABH-004: Compact size for header integration
 * @acceptance AC-ABH-005: Memoized to prevent unnecessary re-renders
 */
export interface AppBrandHeaderProps {
  /** App name to display */
  appName?: string;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Text color */
  color?: string;
  /** Optional custom styles for the container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * AppBrandHeader Component
 *
 * A branded header component displaying the app name.
 * Used in the map top bar for client app branding.
 *
 * @example
 * ```tsx
 * // Default (GLIDEY)
 * <AppBrandHeader />
 *
 * // Custom name
 * <AppBrandHeader appName="DRIVER" size="large" />
 * ```
 */
function AppBrandHeaderComponent({
  appName = 'GLIDEY',
  size = 'medium',
  color,
  style,
  testID,
}: AppBrandHeaderProps) {
  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 22;
      default:
        return 18;
    }
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Text
        style={[
          styles.brandText,
          {
            fontSize: getFontSize(),
            ...(color && { color }),
          },
        ]}
      >
        {appName}
      </Text>
    </View>
  );
}

/**
 * Memoized AppBrandHeader to prevent unnecessary re-renders
 */
export const AppBrandHeader = memo(AppBrandHeaderComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandText: {
    fontWeight: '900',
    letterSpacing: 3,
    color: colors.primary.main,
  },
});
