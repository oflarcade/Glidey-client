import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';

/**
 * @description Props for the TopBar component
 *
 * @acceptance AC-TPB-001: TopBar displays title centered horizontally
 * @acceptance AC-TPB-002: Title uses h3 typography (18px, medium weight)
 * @acceptance AC-TPB-003: Back button appears on left when showBackButton is true
 * @acceptance AC-TPB-004: Back button calls onBackPress when pressed
 * @acceptance AC-TPB-005: Right action slot renders custom content on the right
 * @acceptance AC-TPB-006: TopBar has bottom border (border.light color)
 * @acceptance AC-TPB-007: TopBar respects safe area insets for notched devices
 * @acceptance AC-TPB-008: Background color is primary background (white)
 * @acceptance AC-TPB-009: Left, center, and right sections have equal flex distribution
 * @acceptance AC-TPB-010: Press feedback on back button reduces opacity to 0.7
 */
export interface TopBarProps {
  /** Title text displayed in the center */
  title?: string;
  /** Whether to show the back button on the left */
  showBackButton?: boolean;
  /** Callback fired when back button is pressed */
  onBackPress?: () => void;
  /** Custom content to render in the left slot (overrides showBackButton) */
  leftAction?: React.ReactNode;
  /** Custom content to render in the right slot */
  rightAction?: React.ReactNode;
  /** Optional custom styles for the container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Default back arrow icon component
 * Uses a simple chevron left character for cross-platform compatibility.
 * Wrapped in explicit height container for pixel-perfect alignment with title.
 */
function BackArrow({ color }: { color: string }) {
  const textProps =
    Platform.OS === 'android'
      ? { includeFontPadding: false as const, textAlignVertical: 'center' as const }
      : {};

  return (
    <View style={styles.backArrowContainer}>
      <Text style={[styles.backArrow, { color }]} {...textProps}>
        {'‹'}
      </Text>
    </View>
  );
}

/**
 * TopBar Component
 *
 * App header component with support for back navigation and action slots.
 * Handles safe area insets automatically for notched devices.
 *
 * @example
 * ```tsx
 * // Basic usage with title and back button
 * <TopBar
 *   title="Ride Details"
 *   showBackButton
 *   onBackPress={() => navigation.goBack()}
 * />
 *
 * // With right action
 * <TopBar
 *   title="Profile"
 *   rightAction={<SettingsButton />}
 * />
 *
 * // With custom left action
 * <TopBar
 *   title="Home"
 *   leftAction={<MenuButton />}
 *   rightAction={<NotificationBell />}
 * />
 * ```
 */
export function TopBar({
  title,
  showBackButton = false,
  onBackPress,
  leftAction,
  rightAction,
  style,
  testID,
}: TopBarProps) {
  const insets = useSafeAreaInsets();

  const renderLeftAction = () => {
    if (leftAction) {
      return leftAction;
    }

    if (showBackButton) {
      return (
        <TouchableOpacity
          onPress={onBackPress}
          activeOpacity={0.7}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          testID={`${testID}-back-button`}
        >
          <BackArrow color={colors.text.primary} />
        </TouchableOpacity>
      );
    }

    return null;
  };

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
        {/* Left Section */}
        <View style={styles.leftSection}>
          {renderLeftAction()}
        </View>

        {/* Center Section - Title */}
        <View style={styles.centerSection}>
          {title && (
            <Text
              style={styles.title}
              numberOfLines={1}
              ellipsizeMode="tail"
              accessibilityRole="header"
              {...(Platform.OS === 'android'
                ? { includeFontPadding: false, textAlignVertical: 'center' as const }
                : {})}
            >
              {title}
            </Text>
          )}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightAction}
        </View>
      </View>
    </View>
  );
}

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
    gap: spacing.sm,
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

  backArrowContainer: {
    height: typography.h3.lineHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backArrow: {
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 24,
  },
});
