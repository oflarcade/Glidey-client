import React, { memo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import type { SidebarProfileHeaderProps, StatItem } from './types';

// Avatar configuration
const AVATAR_SIZE = 60;
const AVATAR_BORDER_WIDTH = 3;

/**
 * SidebarProfileHeader Component
 *
 * A profile header for sidebar menus featuring the user's avatar, name,
 * and a row of stats (e.g., hours, distance, jobs completed).
 *
 * @example
 * ```tsx
 * <SidebarProfileHeader
 *   avatarUrl="https://example.com/avatar.jpg"
 *   name="Moussa Diallo"
 *   stats={[
 *     { icon: 'time-outline', value: '10.2', label: 'Hours' },
 *     { icon: 'speedometer-outline', value: '30 KM', label: 'Distance' },
 *     { icon: 'briefcase-outline', value: 20, label: 'Jobs' },
 *   ]}
 *   onProfilePress={() => navigate('Profile')}
 * />
 * ```
 */
function SidebarProfileHeaderComponent({
  avatarUrl,
  name,
  stats,
  onProfilePress,
  testID,
}: SidebarProfileHeaderProps) {
  const insets = useSafeAreaInsets();

  // Generate initials from name for avatar fallback
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
      testID={testID}
    >
      {/* Profile Row: Avatar + Name */}
      <Pressable
        style={({ pressed }) => [
          styles.profileRow,
          pressed && styles.profileRowPressed,
        ]}
        onPress={onProfilePress}
        disabled={!onProfilePress}
        testID={testID ? `${testID}-profile-button` : undefined}
        accessibilityRole="button"
        accessibilityLabel={`${name}'s profile`}
      >
        {/* Avatar */}
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

        {/* Name */}
        <Text
          style={styles.name}
          numberOfLines={2}
          testID={testID ? `${testID}-name` : undefined}
        >
          {name}
        </Text>
      </Pressable>

      {/* Stats Row */}
      <View style={styles.statsRow} testID={testID ? `${testID}-stats` : undefined}>
        {stats.map((stat, index) => (
          <StatItemComponent
            key={`${stat.label}-${index}`}
            stat={stat}
            testID={testID ? `${testID}-stat-${index}` : undefined}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * Individual stat item component
 */
interface StatItemComponentProps {
  stat: StatItem;
  testID?: string;
}

const StatItemComponent = memo(({ stat, testID }: StatItemComponentProps) => {
  // Check if icon is a string (Ionicons name) or a React element
  const isIconElement = typeof stat.icon !== 'string';

  return (
    <View style={styles.statItem} testID={testID}>
      {isIconElement ? (
        stat.icon
      ) : (
        <Ionicons
          name={stat.icon as any}
          size={20}
          color={colors.text.primary}
        />
      )}
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </View>
  );
});

StatItemComponent.displayName = 'StatItemComponent';

/**
 * Memoized SidebarProfileHeader to prevent unnecessary re-renders
 */
export const SidebarProfileHeader = memo(SidebarProfileHeaderComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    minHeight: 180,
  },

  // Profile Row
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  profileRowPressed: {
    opacity: 0.8,
  },

  // Avatar
  avatarContainer: {
    marginRight: spacing.md,
  },

  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: AVATAR_BORDER_WIDTH,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  avatarFallback: {
    backgroundColor: colors.primary.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarInitials: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: typography.h2.fontFamily,
  },

  // Name
  name: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: typography.h2.fontFamily,
    lineHeight: 26,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: typography.h3.fontFamily,
    marginTop: spacing.xs,
  },

  statLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.secondary,
    fontFamily: typography.caption.fontFamily,
    marginTop: 2,
  },
});
