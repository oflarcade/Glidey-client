import React, { memo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

/**
 * @description Props for the ProfileUserCard component
 *
 * @acceptance AC-PUC-001: Avatar displays circular image (48px diameter)
 * @acceptance AC-PUC-002: Avatar shows initials fallback when no image
 * @acceptance AC-PUC-003: Name displays in bold dark text
 * @acceptance AC-PUC-004: Level/subtitle displays in gray below name
 * @acceptance AC-PUC-005: Earnings display on right side with label below
 * @acceptance AC-PUC-006: Component is pressable with feedback
 * @acceptance AC-PUC-007: Proper spacing between elements
 */
export interface ProfileUserCardProps {
  /** URL for the user's avatar image */
  avatarUrl?: string | null;
  /** User's display name */
  name: string;
  /** User's level or subtitle text (e.g., "Basic level") */
  level?: string;
  /** Earnings amount to display (formatted string e.g., "$325.00") */
  earnings?: string;
  /** Label for earnings (e.g., "Earned") */
  earningsLabel?: string;
  /** Callback when the card is pressed */
  onPress?: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * ProfileUserCard Component
 *
 * Displays user profile summary with avatar, name, level, and earnings.
 * Designed to match the Gildey driver app profile screen.
 *
 * @example
 * ```tsx
 * <ProfileUserCard
 *   avatarUrl="https://example.com/avatar.jpg"
 *   name="Glidey Driver 1"
 *   level="Basic level"
 *   earnings="$325.00"
 *   earningsLabel="Earned"
 *   onPress={() => navigate('EditProfile')}
 * />
 * ```
 */
function ProfileUserCardComponent({
  avatarUrl,
  name,
  level,
  earnings,
  earningsLabel = 'Earned',
  onPress,
  testID,
}: ProfileUserCardProps) {
  // Generate initials from name for avatar fallback
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const content = (
    <View style={styles.container} testID={testID}>
      {/* Left: Avatar */}
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            testID={testID ? `${testID}-avatar-image` : undefined}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
      </View>

      {/* Center: Name and Level */}
      <View style={styles.infoContainer}>
        <Text
          style={styles.name}
          numberOfLines={1}
          testID={testID ? `${testID}-name` : undefined}
        >
          {name}
        </Text>
        {level && (
          <Text
            style={styles.level}
            numberOfLines={1}
            testID={testID ? `${testID}-level` : undefined}
          >
            {level}
          </Text>
        )}
      </View>

      {/* Right: Earnings */}
      {earnings && (
        <View style={styles.earningsContainer}>
          <Text
            style={styles.earnings}
            testID={testID ? `${testID}-earnings` : undefined}
          >
            {earnings}
          </Text>
          <Text
            style={styles.earningsLabel}
            testID={testID ? `${testID}-earnings-label` : undefined}
          >
            {earningsLabel}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${name}'s profile`}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

export const ProfileUserCard = memo(ProfileUserCardComponent);

const AVATAR_SIZE = 48;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.primary,
  },

  pressed: {
    opacity: 0.7,
  },

  // Avatar
  avatarContainer: {
    marginRight: spacing.md,
  },

  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  avatarFallback: {
    backgroundColor: colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarInitials: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: typography.h3.fontFamily,
  },

  // Info
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: typography.h4.fontFamily,
    lineHeight: 22,
  },

  level: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.tertiary,
    fontFamily: typography.caption.fontFamily,
    marginTop: 2,
  },

  // Earnings
  earningsContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  earnings: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: typography.h4.fontFamily,
    lineHeight: 22,
  },

  earningsLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.tertiary,
    fontFamily: typography.caption.fontFamily,
    marginTop: 2,
  },
});
