import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';

/**
 * Individual stat item type
 */
export interface ProfileStat {
  /** The numeric or text value to display (e.g., "10.2", "30 KM", "20") */
  value: string | number;
  /** The label below the value (e.g., "HOURS ONLINE") */
  label: string;
}

/**
 * @description Props for the ProfileStatsCard component
 *
 * @acceptance AC-PSC-001: Card displays with yellow background (#FECB00)
 * @acceptance AC-PSC-002: Card has rounded corners (~16px)
 * @acceptance AC-PSC-003: Stats display in horizontal row
 * @acceptance AC-PSC-004: Stat values are bold, dark text
 * @acceptance AC-PSC-005: Stat labels are uppercase, smaller, gray text
 * @acceptance AC-PSC-006: Proper horizontal margin from screen edges
 * @acceptance AC-PSC-007: Stats are evenly distributed across the width
 */
export interface ProfileStatsCardProps {
  /** Array of stats to display (max 3 recommended) */
  stats: ProfileStat[];
  /** Optional custom styles for the container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * ProfileStatsCard Component
 *
 * A yellow stats card displaying driver metrics like hours online,
 * total distance, and completed jobs.
 *
 * @example
 * ```tsx
 * <ProfileStatsCard
 *   stats={[
 *     { value: '10.2', label: 'HOURS ONLINE' },
 *     { value: '30 KM', label: 'TOTAL DISTANCE' },
 *     { value: '20', label: 'TOTAL JOBS' },
 *   ]}
 * />
 * ```
 */
function ProfileStatsCardComponent({
  stats,
  style,
  testID,
}: ProfileStatsCardProps) {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.card}>
        {stats.map((stat, index) => (
          <View
            key={`${stat.label}-${index}`}
            style={styles.statItem}
            testID={testID ? `${testID}-stat-${index}` : undefined}
          >
            <Text style={styles.statValue}>
              {typeof stat.value === 'number' ? stat.value.toString() : stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export const ProfileStatsCard = memo(ProfileStatsCardComponent);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },

  card: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: typography.h2.fontFamily,
    textAlign: 'center',
  },

  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.secondary,
    fontFamily: typography.caption.fontFamily,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: spacing.xs,
    letterSpacing: 0.3,
  },
});
