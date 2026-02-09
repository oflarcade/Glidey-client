import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { legacyColors as colors } from '../../theme/colors';
import { spacing, borderRadius, typography } from '../../theme/tokens';

export interface LocationDeniedBannerProps {
  /** Whether the banner is visible */
  visible: boolean;
  /** Called when banner is pressed */
  onPress: () => void;
  /** Main text to display */
  text?: string;
  /** Action text (tap to enable) */
  actionText?: string;
  /** Variant style */
  variant?: 'warning' | 'error';
  /** Position from top (accounts for top bar) */
  topOffset?: number;
  /** Test ID for testing */
  testID?: string;
}

/**
 * LocationDeniedBanner Component
 *
 * A small banner shown at the top of the screen when location permission
 * is denied. Tappable to either re-request permission or open settings.
 *
 * @example
 * ```tsx
 * <LocationDeniedBanner
 *   visible={permissionStatus === 'denied'}
 *   onPress={requestPermission}
 *   text="Location disabled"
 *   actionText="Tap to enable"
 * />
 * ```
 *
 * Acceptance Criteria:
 * - AC-LDB-001: Banner appears below the top bar
 * - AC-LDB-002: Shows location icon and message
 * - AC-LDB-003: Entire banner is tappable
 * - AC-LDB-004: Smooth slide-in animation
 * - AC-LDB-005: Warning/error variants supported
 */
function LocationDeniedBannerComponent({
  visible,
  onPress,
  text = 'Location disabled',
  actionText = 'Tap to enable',
  variant = 'warning',
  topOffset = 0,
  testID = 'location-denied-banner',
}: LocationDeniedBannerProps) {
  const insets = useSafeAreaInsets();

  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  if (!visible) {
    return null;
  }

  const backgroundColor = variant === 'error' 
    ? colors.error 
    : colors.warning;

  return (
    <View
      style={[
        styles.container,
        { top: topOffset || (insets.top + spacing.xs) },
      ]}
      testID={testID}
    >
      <Pressable
        style={({ pressed }) => [
          styles.banner,
          { backgroundColor },
          pressed && styles.bannerPressed,
        ]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${text}. ${actionText}`}
        accessibilityHint="Double tap to enable location services"
      >
        {/* Location icon */}
        <Ionicons
          name="location-sharp"
          size={16}
          color={colors.text.inverse}
          style={styles.icon}
        />

        {/* Text content */}
        <Text style={styles.text} numberOfLines={1}>
          {text}
        </Text>

        {/* Separator dot */}
        <View style={styles.dot} />

        {/* Action text */}
        <Text style={styles.actionText} numberOfLines={1}>
          {actionText}
        </Text>

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={14}
          color={colors.text.inverse}
          style={styles.chevron}
        />
      </Pressable>
    </View>
  );
}

export const LocationDeniedBanner = memo(LocationDeniedBannerComponent);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 100,
    alignItems: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bannerPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  icon: {
    marginRight: spacing.xs,
  },
  text: {
    ...typography.bodySmall,
    color: colors.text.inverse,
    fontWeight: '500',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.inverse,
    marginHorizontal: spacing.sm,
    opacity: 0.7,
  },
  actionText: {
    ...typography.bodySmall,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  chevron: {
    marginLeft: spacing.xs,
    opacity: 0.7,
  },
});

export default LocationDeniedBanner;
