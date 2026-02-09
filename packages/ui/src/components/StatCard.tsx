import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Card } from './Card';
import { colors, spacing, borderRadius, typography } from '../theme';

type TrendDirection = 'up' | 'down' | 'neutral';

interface StatCardProps {
  /** Label/title for the statistic */
  title: string;
  /** The numeric or string value to display */
  value: string | number;
  /** Optional unit to display after the value (e.g., "XOF", "km") */
  unit?: string;
  /** Direction of the trend indicator */
  trend?: TrendDirection;
  /** Value to display for the trend (e.g., "+12%", "-5%") */
  trendValue?: string;
  /** Optional icon to display */
  icon?: React.ReactNode;
  /** Custom styles for the container */
  style?: ViewStyle;
}

/**
 * StatCard Component
 * 
 * Displays statistics with optional trend indicators.
 * Commonly used for driver earnings, ride counts, and performance metrics.
 * 
 * @example
 * // Basic usage
 * <StatCard title="Today's Earnings" value="15,000" unit="XOF" />
 * 
 * @example
 * // With trend
 * <StatCard 
 *   title="Weekly Earnings" 
 *   value="125,000" 
 *   unit="XOF" 
 *   trend="up" 
 *   trendValue="+12%" 
 * />
 * 
 * Acceptance Criteria:
 * - AC-STC-001: Displays title/label correctly
 * - AC-STC-002: Displays value with proper formatting
 * - AC-STC-003: Unit displays after value when provided
 * - AC-STC-004: Up trend shows green arrow and text
 * - AC-STC-005: Down trend shows red arrow and text
 * - AC-STC-006: Neutral trend shows gray indicator
 * - AC-STC-007: Uses Card component as base
 * - AC-STC-008: Supports XOF currency formatting
 */
export function StatCard({
  title,
  value,
  unit,
  trend,
  trendValue,
  icon,
  style,
}: StatCardProps) {
  const getTrendColor = (direction: TrendDirection): string => {
    switch (direction) {
      case 'up':
        return colors.success;
      case 'down':
        return colors.error;
      case 'neutral':
      default:
        return colors.text.tertiary;
    }
  };

  const getTrendArrow = (direction: TrendDirection): string => {
    switch (direction) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      case 'neutral':
      default:
        return '→';
    }
  };

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format number with thousand separators for XOF
      return val.toLocaleString('fr-FR');
    }
    return val;
  };

  return (
    <Card variant="elevated" padding="medium" style={style}>
      <View style={styles.container}>
        {icon && (
          <View style={styles.iconContainer}>
            {icon}
          </View>
        )}
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{formatValue(value)}</Text>
            {unit && <Text style={styles.unit}>{unit}</Text>}
          </View>
          {trend && trendValue && (
            <View style={styles.trendContainer}>
              <Text style={[styles.trendText, { color: getTrendColor(trend) }]}>
                {getTrendArrow(trend)} {trendValue}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconContainer: {
    padding: spacing.sm,
    backgroundColor: colors.primary.light + '30',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  value: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
  },
  unit: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  trendContainer: {
    marginTop: spacing.xs,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
