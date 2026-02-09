import React, { memo } from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import {
  secondaryColors,
  neutralColors,
  spacing,
  borderRadius,
  typography,
} from '../../theme';
import { Text } from '../Text';
import type {
  DriverNotificationBannerProps,
  BannerVariant,
  TurnDirection,
} from './types';

/**
 * DriverNotificationBanner Component
 *
 * A notification banner for the driver app displaying status messages
 * or navigation instructions. Features orange background with dark text.
 *
 * Variants:
 * - offline: Shows when driver is offline with moon icon
 * - license: Shows when license verification is required
 * - phone: Shows when phone verification is required
 * - navigation: Shows turn-by-turn navigation instructions
 *
 * @example
 * ```tsx
 * // Offline status banner
 * <DriverNotificationBanner
 *   variant="offline"
 *   title="You are offline!"
 *   subtitle="Go online to start accepting jobs."
 *   icon={<MoonIcon />}
 *   onPress={handleGoOnline}
 * />
 *
 * // Navigation banner
 * <DriverNotificationBanner
 *   variant="navigation"
 *   distance="250m"
 *   turnDirection="right"
 *   instruction="Turn right at 105 William St, Chicago, US"
 * />
 * ```
 */
function DriverNotificationBannerComponent({
  variant,
  title,
  subtitle,
  icon,
  distance,
  turnDirection = 'straight',
  instruction,
  onPress,
  style,
  accessibilityLabel,
  testID,
}: DriverNotificationBannerProps) {
  const isNavigationVariant = variant === 'navigation';

  // Generate accessibility label based on variant
  const getAccessibilityLabel = (): string => {
    if (accessibilityLabel) return accessibilityLabel;
    if (isNavigationVariant) {
      return `Navigation: ${distance || ''} ${instruction || ''}`.trim();
    }
    return `${title || ''} ${subtitle || ''}`.trim();
  };

  const content = isNavigationVariant
    ? renderNavigationContent(distance, turnDirection, instruction)
    : renderStatusContent(icon, title, subtitle);

  const containerStyles: ViewStyle[] = [styles.container, style].filter(
    Boolean
  ) as ViewStyle[];

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          containerStyles,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityRole="button"
        testID={testID}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={containerStyles}
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityRole="alert"
      testID={testID}
    >
      {content}
    </View>
  );
}

/**
 * Renders content for status variants (offline, license, phone)
 */
function renderStatusContent(
  icon: React.ReactNode | undefined,
  title: string | undefined,
  subtitle: string | undefined
) {
  return (
    <View style={styles.statusContent}>
      {/* Icon in dashed circular border */}
      <View style={styles.iconContainer}>
        <View style={styles.dashedCircle}>
          {icon}
        </View>
      </View>

      {/* Text content */}
      <View style={styles.textContainer}>
        {title && (
          <Text
            variant="h4"
            style={styles.title}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
        {subtitle && (
          <Text
            variant="bodySmall"
            style={styles.subtitle}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

/**
 * Renders content for navigation variant
 */
function renderNavigationContent(
  distance: string | undefined,
  turnDirection: TurnDirection,
  instruction: string | undefined
) {
  return (
    <View style={styles.navigationContent}>
      {/* Turn direction icon with distance */}
      <View style={styles.turnContainer}>
        <View style={styles.turnIconWrapper}>
          {renderTurnIcon(turnDirection)}
        </View>
        {distance && (
          <Text variant="h4" style={styles.distanceText}>
            {distance}
          </Text>
        )}
      </View>

      {/* Navigation instruction */}
      {instruction && (
        <Text
          variant="body"
          style={styles.instructionText}
          numberOfLines={2}
        >
          {instruction}
        </Text>
      )}
    </View>
  );
}

/**
 * Renders the appropriate turn direction arrow icon
 * Uses Unicode arrows for basic implementation - can be replaced with SVG icons
 */
function renderTurnIcon(direction: TurnDirection) {
  // Unicode arrow characters for turn directions
  // These should be replaced with proper SVG icons from @expo/vector-icons
  const arrows: Record<TurnDirection, string> = {
    left: '↰',
    right: '↱',
    straight: '↑',
    'u-turn': '↩',
  };

  return (
    <Text style={styles.turnIcon}>
      {arrows[direction]}
    </Text>
  );
}

/**
 * Memoized DriverNotificationBanner to prevent unnecessary re-renders
 */
export const DriverNotificationBanner = memo(DriverNotificationBannerComponent);

// =============================================================================
// STYLES
// =============================================================================

const BANNER_HEIGHT = 64;
const ICON_CIRCLE_SIZE = 44;
const ICON_CIRCLE_BORDER_WIDTH = 2;
const ICON_CIRCLE_DASH_GAP = 4;

const styles = StyleSheet.create({
  container: {
    height: BANNER_HEIGHT,
    backgroundColor: secondaryColors[500],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },

  pressed: {
    opacity: 0.9,
  },

  // Status variant styles
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  dashedCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    borderWidth: ICON_CIRCLE_BORDER_WIDTH,
    borderColor: neutralColors[900],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  title: {
    color: neutralColors[900],
    fontWeight: '700',
  },

  subtitle: {
    color: neutralColors[900],
    marginTop: 2,
  },

  // Navigation variant styles
  navigationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  turnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  turnIconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  turnIcon: {
    fontSize: 28,
    color: neutralColors[900],
    fontWeight: '700',
  },

  distanceText: {
    color: neutralColors[900],
    fontWeight: '700',
  },

  instructionText: {
    flex: 1,
    color: neutralColors[900],
  },
});
