import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { borderRadius, colors, spacing } from '../../theme';

// ─── ProgressBar ─────────────────────────────────────────────────────────────

export interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  color = colors.primary.main,
  height = 6,
  style,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped * 100}%`,
            height,
            borderRadius: height / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

// ─── ArrivalBanner ───────────────────────────────────────────────────────────

export interface ArrivalBannerProps {
  driverName: string;
  etaMinutes: number;
  progress: number;
  style?: ViewStyle;
}

export function ArrivalBanner({
  driverName,
  etaMinutes,
  progress,
  style,
}: ArrivalBannerProps) {
  const displayName = driverName.trim() || 'Your driver';
  const etaLabel = etaMinutes <= 0 ? 'Arriving now' : `~${Math.round(etaMinutes)} min`;

  return (
    <View style={[styles.banner, style]}>
      <View style={styles.infoRow}>
        <Text style={styles.nameText} numberOfLines={1}>
          {displayName} is on the way
        </Text>
        <View style={styles.etaChip}>
          <Text style={styles.etaText}>{etaLabel}</Text>
        </View>
      </View>
      <ProgressBar progress={progress} style={styles.progressBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: colors.border.light,
    overflow: 'hidden',
  },
  fill: {},
  banner: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  nameText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  etaChip: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  etaText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  progressBar: {
    marginTop: spacing.xs,
  },
});
