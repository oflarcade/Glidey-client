import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { legacyColors as colors, spacing, typography, borderRadius } from '../../theme';
import { Text } from '../Text';

/**
 * @description Props for the OnlineStatusIndicator component
 *
 * @acceptance AC-OSI-001: Shows "Online" text with green indicator when online
 * @acceptance AC-OSI-002: Shows "Offline" text with gray indicator when offline
 * @acceptance AC-OSI-003: Indicator dot pulses when online (future animation)
 * @acceptance AC-OSI-004: Compact size for header integration
 * @acceptance AC-OSI-005: Memoized to prevent unnecessary re-renders
 */
export interface OnlineStatusIndicatorProps {
  /** Current online status */
  isOnline: boolean;
  /** Whether to show the label text */
  showLabel?: boolean;
  /** Size variant */
  size?: 'small' | 'medium';
  /** Optional custom styles for the container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * OnlineStatusIndicator Component
 *
 * A status indicator showing driver's online/offline state.
 * Features a colored dot and optional label text.
 *
 * @example
 * ```tsx
 * // Compact (dot only)
 * <OnlineStatusIndicator isOnline={isOnline} />
 *
 * // With label
 * <OnlineStatusIndicator isOnline={isOnline} showLabel />
 * ```
 */
function OnlineStatusIndicatorComponent({
  isOnline,
  showLabel = true,
  size = 'medium',
  style,
  testID,
}: OnlineStatusIndicatorProps) {
  const dotSize = size === 'small' ? 8 : 10;
  const ringSize = size === 'small' ? 16 : 20;

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Status dot with optional ring */}
      <View style={styles.dotContainer}>
        {isOnline && (
          <View
            style={[
              styles.ring,
              {
                width: ringSize,
                height: ringSize,
                borderRadius: ringSize / 2,
                backgroundColor: colors.success + '30',
              },
            ]}
          />
        )}
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: isOnline ? colors.success : colors.text.tertiary,
            },
          ]}
        />
      </View>

      {/* Label text */}
      {showLabel && (
        <Text
          style={[
            styles.label,
            size === 'small' && styles.labelSmall,
            { color: isOnline ? colors.success : colors.text.tertiary },
          ]}
        >
          {isOnline ? 'Online' : 'Offline'}
        </Text>
      )}
    </View>
  );
}

/**
 * Memoized OnlineStatusIndicator to prevent unnecessary re-renders
 */
export const OnlineStatusIndicator = memo(OnlineStatusIndicatorComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  dotContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ring: {
    position: 'absolute',
  },

  dot: {
    zIndex: 1,
  },

  label: {
    ...typography.bodySmall,
    fontWeight: '600',
  },

  labelSmall: {
    ...typography.caption,
  },
});
