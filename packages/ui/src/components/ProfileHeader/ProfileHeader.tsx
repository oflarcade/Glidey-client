import React, { memo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';

/**
 * @description Props for the ProfileHeader component
 *
 * @acceptance AC-PFH-001: ProfileHeader displays title centered horizontally
 * @acceptance AC-PFH-002: Title uses h3 typography (18px, medium weight)
 * @acceptance AC-PFH-003: Back button displays dark arrow on left (matches TopBar)
 * @acceptance AC-PFH-004: Back button calls onBackPress when pressed
 * @acceptance AC-PFH-005: Background is white with bottom border (matches TopBar)
 * @acceptance AC-PFH-006: Safe area insets are respected for notched devices
 * @acceptance AC-PFH-007: Press feedback reduces opacity
 */
export interface ProfileHeaderProps {
  /** Title text displayed in the center */
  title: string;
  /** Callback fired when back button is pressed */
  onBackPress?: () => void;
  /** Custom content to render in the right slot */
  rightAction?: React.ReactNode;
  /** Optional custom styles for the container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Back arrow icon matching the design
 * Uses a left-pointing arrow character styled to match the screenshot
 */
function BackArrow() {
  return (
    <View style={styles.backArrowContainer}>
      <Text style={styles.backArrow}>←</Text>
    </View>
  );
}

/**
 * ProfileHeader Component
 *
 * A clean header for profile screens with back button and centered title.
 * Matches TopBar / notification history styling (dark back icon, bottom border).
 *
 * @example
 * ```tsx
 * <ProfileHeader
 *   title="Profile"
 *   onBackPress={() => router.back()}
 * />
 * ```
 */
function ProfileHeaderComponent({
  title,
  onBackPress,
  rightAction,
  style,
  testID,
}: ProfileHeaderProps) {
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
        {/* Left Section - Back Button */}
        <View style={styles.leftSection}>
          <Pressable
            onPress={onBackPress}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            testID={testID ? `${testID}-back-button` : undefined}
          >
            <BackArrow />
          </Pressable>
        </View>

        {/* Center Section - Title */}
        <View style={styles.centerSection}>
          <Text
            style={styles.title}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {title}
          </Text>
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightAction}
        </View>
      </View>
    </View>
  );
}

export const ProfileHeader = memo(ProfileHeaderComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 56,
  },

  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
  },

  title: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },

  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },

  backButtonPressed: {
    opacity: 0.7,
  },

  backArrowContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    fontSize: 24,
    fontWeight: '400',
    color: colors.text.primary,
    lineHeight: Platform.OS === 'ios' ? 28 : 32,
  },
});
