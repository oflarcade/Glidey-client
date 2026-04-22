import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Avatar, Badge } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import type { Ride } from '@rentascooter/shared';

export interface TripReceiptProps {
  ride: Ride;
  /** Optional rider note — shown in "NOTED" section only when present */
  note?: string;
  /** Payment method label shown as a tag (e.g. "Cash", "Wave") */
  paymentMethod?: string;
  /** Discount applied in XOF — renders discount tag only when > 0 */
  discountAmount?: number;
  /** Called when the Download PDF affordance is tapped (implemented in T-003) */
  onDownloadPdf?: () => void;
}

function formatXOF(amount: number | undefined | null): string {
  if (amount == null) return '—';
  return `${Number(amount).toLocaleString()} XOF`;
}

function formatDistance(distanceM: number | undefined | null): string {
  if (distanceM == null) return '—';
  return `${(distanceM / 1000).toFixed(1)} km`;
}

function getDriverFullName(driverInfo: Ride['driverInfo']): string {
  if (!driverInfo) return '—';
  const { firstName, lastName } = driverInfo;
  if (firstName && lastName) return `${firstName} ${lastName.charAt(0)}.`;
  return firstName ?? '—';
}

export function TripReceipt({
  ride,
  note,
  paymentMethod,
  discountAmount,
  onDownloadPdf: _onDownloadPdf,
}: TripReceiptProps) {
  const driverName = getDriverFullName(ride.driverInfo);
  const avatarSource =
    ride.driverInfo?.profilePicture ? { uri: ride.driverInfo.profilePicture } : null;

  const pickupLabel = ride.pickup?.name ?? ride.pickup?.address ?? '—';
  const dropOffLabel = ride.destination?.name ?? ride.destination?.address ?? '—';
  const showDiscount = discountAmount != null && discountAmount > 0;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Driver header ── */}
      <View style={styles.driverHeader}>
        <Avatar source={avatarSource} name={driverName} size="medium" />

        <View style={styles.driverDetails}>
          <Text style={styles.driverName} numberOfLines={1}>
            {driverName}
          </Text>
          <Text style={styles.distanceText}>{formatDistance(ride.route?.distanceM)}</Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.totalFare}>{formatXOF(ride.fare?.total)}</Text>
          <View style={styles.tagsRow}>
            {paymentMethod ? (
              <Badge label={paymentMethod} variant="primary" size="small" style={styles.tag} />
            ) : null}
            {showDiscount ? (
              <Badge
                label={`-${formatXOF(discountAmount)}`}
                variant="success"
                size="small"
                style={styles.tag}
              />
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── Address sections ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PICK UP</Text>
        <Text style={styles.sectionValue} numberOfLines={2}>
          {pickupLabel}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DROP OFF</Text>
        <Text style={styles.sectionValue} numberOfLines={2}>
          {dropOffLabel}
        </Text>
      </View>

      {note ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTED</Text>
          <Text style={styles.sectionValue}>{note}</Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      {/* ── Trip fare ── */}
      <View style={styles.fareSection}>
        <Text style={styles.fareSectionTitle}>TRIP FARE</Text>

        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Base fare</Text>
          <Text style={styles.fareValue}>{formatXOF(ride.fare?.baseFare)}</Text>
        </View>

        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Distance fare</Text>
          <Text style={styles.fareValue}>{formatXOF(ride.fare?.distanceFare)}</Text>
        </View>

        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Time fare</Text>
          <Text style={styles.fareValue}>{formatXOF(ride.fare?.timeFare)}</Text>
        </View>

        <View style={styles.amountPaidDivider} />

        <View style={styles.fareRow}>
          <Text style={styles.amountPaidLabel}>Amount Paid</Text>
          <Text style={styles.amountPaidValue}>{formatXOF(ride.fare?.total)}</Text>
        </View>
      </View>

      {/* ── PDF stub placeholder — implemented in T-003 ── */}
      <View style={styles.pdfPlaceholder} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
  },

  // Driver header
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  driverDetails: {
    flex: 1,
    gap: 2,
  },
  driverName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  distanceText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  totalFare: {
    ...typography.h3,
    color: colors.primary.main,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tag: {
    marginLeft: 0,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.background.tertiary,
    marginVertical: spacing.sm,
  },

  // Address sections
  section: {
    paddingVertical: spacing.sm,
    gap: 4,
  },
  sectionLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  sectionValue: {
    ...typography.body,
    color: colors.text.primary,
  },

  // Fare section
  fareSection: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  fareSectionTitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  fareLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  fareValue: {
    ...typography.body,
    color: colors.text.primary,
  },
  amountPaidDivider: {
    height: 1,
    backgroundColor: colors.background.tertiary,
    marginVertical: spacing.xs,
  },
  amountPaidLabel: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  amountPaidValue: {
    ...typography.body,
    color: colors.primary.main,
    fontWeight: '700',
    fontSize: 16,
  },

  // PDF stub placeholder
  pdfPlaceholder: {
    height: spacing.lg,
  },
});
