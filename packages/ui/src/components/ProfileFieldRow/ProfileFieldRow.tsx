import React, { memo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

/**
 * Verification status type
 */
export type VerificationStatus = 'verified' | 'pending' | 'none';

/**
 * @description Props for the ProfileFieldRow component
 *
 * @acceptance AC-PFR-001: Label displays on left in dark text
 * @acceptance AC-PFR-002: Value displays on right in gray text
 * @acceptance AC-PFR-003: Verified icon shows green circle with white check
 * @acceptance AC-PFR-004: Pending icon shows yellow circle
 * @acceptance AC-PFR-005: Arrow chevron displays when navigable
 * @acceptance AC-PFR-006: Row has white background with bottom border
 * @acceptance AC-PFR-007: Row is pressable with feedback when onPress provided
 * @acceptance AC-PFR-008: Proper horizontal padding matches design
 */
export interface ProfileFieldRowProps {
  /** Label text on the left (e.g., "First & Last name") */
  label: string;
  /** Value text on the right (e.g., "Glidey Driver 1") */
  value?: string;
  /** Verification status to show icon */
  verificationStatus?: VerificationStatus;
  /** Whether to show navigation arrow */
  showArrow?: boolean;
  /** Callback when row is pressed */
  onPress?: () => void;
  /** Whether this is the last row (no bottom border) */
  isLast?: boolean;
  /** Custom content to render instead of value */
  rightContent?: React.ReactNode;
  /** Optional custom styles for the container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Verified checkmark icon (green circle with white check)
 */
function VerifiedIcon() {
  return (
    <View style={styles.verifiedIcon}>
      <Text style={styles.verifiedCheck}>✓</Text>
    </View>
  );
}

/**
 * Pending icon (yellow circle)
 */
function PendingIcon() {
  return (
    <View style={styles.pendingIcon}>
      <Text style={styles.pendingText}>!</Text>
    </View>
  );
}

/**
 * Chevron right arrow for navigation
 */
function ChevronRight() {
  return (
    <Text style={styles.chevron}>›</Text>
  );
}

/**
 * ProfileFieldRow Component
 *
 * A row component for displaying profile field information with optional
 * verification icon and navigation arrow.
 *
 * @example
 * ```tsx
 * <ProfileFieldRow
 *   label="Phone number"
 *   value="584-490-9153"
 *   verificationStatus="verified"
 *   onPress={() => navigate('EditPhone')}
 * />
 *
 * <ProfileFieldRow
 *   label="Driver Licence"
 *   value="Verified"
 *   verificationStatus="verified"
 *   isLast
 * />
 * ```
 */
function ProfileFieldRowComponent({
  label,
  value,
  verificationStatus = 'none',
  showArrow = false,
  onPress,
  isLast = false,
  rightContent,
  style,
  testID,
}: ProfileFieldRowProps) {
  const content = (
    <View
      style={[
        styles.container,
        !isLast && styles.borderBottom,
        style,
      ]}
      testID={testID}
    >
      {/* Left: Label */}
      <View style={styles.labelContainer}>
        <Text
          style={styles.label}
          numberOfLines={1}
          testID={testID ? `${testID}-label` : undefined}
        >
          {label}
        </Text>
      </View>

      {/* Right: Value, Verification Icon, Arrow */}
      <View style={styles.rightContainer}>
        {rightContent ? (
          rightContent
        ) : (
          <>
            {value && (
              <Text
                style={styles.value}
                numberOfLines={1}
                testID={testID ? `${testID}-value` : undefined}
              >
                {value}
              </Text>
            )}
          </>
        )}

        {/* Verification Icon */}
        {verificationStatus === 'verified' && <VerifiedIcon />}
        {verificationStatus === 'pending' && <PendingIcon />}

        {/* Arrow */}
        {showArrow && <ChevronRight />}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || ''}`}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

export const ProfileFieldRow = memo(ProfileFieldRowComponent);

const ICON_SIZE = 20;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.primary,
    minHeight: 52,
  },

  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },

  pressed: {
    backgroundColor: colors.background.secondary,
  },

  labelContainer: {
    flex: 1,
    paddingRight: spacing.md,
  },

  label: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.primary,
    fontFamily: typography.body.fontFamily,
  },

  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: '60%',
  },

  value: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.tertiary,
    fontFamily: typography.body.fontFamily,
    textAlign: 'right',
    flexShrink: 1,
  },

  // Verified Icon
  verifiedIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifiedCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },

  // Pending Icon
  pendingIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pendingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },

  // Chevron
  chevron: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.text.tertiary,
    lineHeight: 22,
  },
});
