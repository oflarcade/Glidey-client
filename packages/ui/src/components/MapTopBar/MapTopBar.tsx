import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, shadows, borderRadius } from '../../theme';

/**
 * @description Props for the MapTopBar component
 *
 * @acceptance AC-MTB-001: MapTopBar floats over map with absolute positioning
 * @acceptance AC-MTB-002: Background is semi-transparent white (rgba 255,255,255,0.95)
 * @acceptance AC-MTB-003: Has blur effect on iOS, solid background on Android
 * @acceptance AC-MTB-004: Respects safe area insets for notched devices
 * @acceptance AC-MTB-005: Shadow provides depth separation from map
 * @acceptance AC-MTB-006: Height is ~56px content area
 * @acceptance AC-MTB-007: Horizontal padding uses theme spacing.md (16px)
 * @acceptance AC-MTB-008: Left icon slot renders custom content
 * @acceptance AC-MTB-009: Center content slot for status/branding
 * @acceptance AC-MTB-010: Right content slot for toggles/actions
 * @acceptance AC-MTB-011: Left press handler fires when left area tapped
 * @acceptance AC-MTB-012: Border radius on bottom corners for floating effect
 */
export interface MapTopBarProps {
  /** Left icon slot (e.g., menu icon) */
  leftIcon?: React.ReactNode;
  /** Center content slot (e.g., status indicator or branding) */
  centerContent?: React.ReactNode;
  /** Right content slot (e.g., toggle or action buttons) */
  rightContent?: React.ReactNode;
  /** Press handler for left icon area */
  onLeftPress?: () => void;
  /** Optional custom styles for the container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * MapTopBar Component
 *
 * A floating top bar designed to overlay a full-screen map.
 * Features semi-transparent background with blur effect and shadow for depth.
 *
 * @example
 * ```tsx
 * // Driver app with status toggle
 * <MapTopBar
 *   leftIcon={<Icon name="menu" />}
 *   centerContent={<OnlineStatusIndicator isOnline={isOnline} />}
 *   rightContent={<DriverStatusToggle isOnline={isOnline} onToggle={toggle} />}
 *   onLeftPress={openDrawer}
 * />
 *
 * // Client app with branding
 * <MapTopBar
 *   leftIcon={<Icon name="menu" />}
 *   centerContent={<AppBrandHeader />}
 *   onLeftPress={openDrawer}
 * />
 * ```
 */
export function MapTopBar({
  leftIcon,
  centerContent,
  rightContent,
  onLeftPress,
  style,
  testID,
}: MapTopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
        style,
      ]}
      testID={testID}
    >
      <View style={styles.content}>
        {/* Left Section - entire area tappable when onLeftPress is provided */}
        <View style={styles.leftSection}>
          {onLeftPress ? (
            <Pressable
              onPress={onLeftPress}
              style={({ pressed }) => [
                styles.leftIconButton,
                pressed && styles.leftIconButtonPressed,
              ]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Menu"
              accessibilityRole="button"
              testID={testID ? `${testID}-left-button` : undefined}
            >
              {leftIcon}
            </Pressable>
          ) : (
            <View style={styles.leftIconButton}>{leftIcon}</View>
          )}
        </View>

        {/* Center Section */}
        <View style={styles.centerSection}>
          {centerContent}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightContent}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    ...(Platform.OS === 'android' && { elevation: 100 }),
    backgroundColor: Platform.select({
      ios: 'rgba(255, 255, 255, 0.92)',
      android: 'rgba(255, 255, 255, 0.98)',
    }),
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    ...shadows.medium,
    // iOS blur effect approximation through background opacity
    ...(Platform.OS === 'ios' && {
      backdropFilter: 'blur(20px)',
    }),
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },

  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  leftIconButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'stretch',
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: borderRadius.md,
    minHeight: 44,
  },
  leftIconButtonPressed: {
    opacity: 0.7,
  },

  centerSection: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
