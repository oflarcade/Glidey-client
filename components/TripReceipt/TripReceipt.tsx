import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
  /** Called when Download PDF is tapped; defaults to a "coming soon" Alert */
  onDownloadPdf?: () => void;
  /** Background color of the host screen — used to render torn-edge cutouts */
  hostBackgroundColor?: string;
}

const SCALLOP_RADIUS = 8;
const SCALLOP_HEIGHT = SCALLOP_RADIUS;
const DRIVER_DETAILS_GAP = spacing.xs;
const SECTION_GAP = spacing.xs;
const FARE_ROW_VERTICAL_PADDING = spacing.xs / 2;

/** Generates an SVG path for a scalloped edge strip.
 *  The strip fills with `hostBackgroundColor` and has arcs cut into one side,
 *  creating the visual of holes punched along the card's edge.
 *  `side='top'` → arcs open downward (into the card from above)
 *  `side='bottom'` → arcs open upward (into the card from below)
 */
function scallopPath(width: number, side: 'top' | 'bottom'): string {
  const r = SCALLOP_RADIUS;
  const count = Math.max(1, Math.floor(width / (r * 2)));
  const totalArcWidth = count * r * 2;
  const startX = (width - totalArcWidth) / 2;

  if (side === 'bottom') {
    // Strip sits below the card. Top edge has arcs opening UPWARD (into card bottom).
    // sweep=0 → counterclockwise → arc bulges upward
    let d = `M 0,${r}`;
    if (startX > 0) d += ` L ${startX},${r}`;
    for (let i = 0; i < count; i++) {
      const x2 = startX + (i + 1) * r * 2;
      d += ` A ${r} ${r} 0 0 0 ${x2} ${r}`;
    }
    if (startX > 0) d += ` L ${width},${r}`;
    d += ` L ${width},0 L 0,0 Z`;
    return d;
  } else {
    // Strip sits above the card. Bottom edge has arcs opening DOWNWARD (into card top).
    // sweep=1 → clockwise → arc bulges downward
    let d = `M 0,0`;
    if (startX > 0) d += ` L ${startX},0`;
    for (let i = 0; i < count; i++) {
      const x2 = startX + (i + 1) * r * 2;
      d += ` A ${r} ${r} 0 0 1 ${x2} 0`;
    }
    if (startX > 0) d += ` L ${width},0`;
    d += ` L ${width},${r} L 0,${r} Z`;
    return d;
  }
}

function ScallopEdge({
  width,
  side,
  fill,
}: {
  width: number;
  side: 'top' | 'bottom';
  fill: string;
}) {
  if (width <= 0) return null;
  return (
    <Svg
      width={width}
      height={SCALLOP_HEIGHT}
      style={side === 'top' ? styles.scallopTop : styles.scallopBottom}
    >
      <Path d={scallopPath(width, side)} fill={fill} />
    </Svg>
  );
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
  onDownloadPdf,
  hostBackgroundColor = colors.background.secondary,
}: TripReceiptProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - spacing.lg * 2;

  const driverName = getDriverFullName(ride.driverInfo);
  const avatarSource =
    ride.driverInfo?.profilePicture ? { uri: ride.driverInfo.profilePicture } : null;

  const pickupLabel = ride.pickup?.name ?? ride.pickup?.address ?? '—';
  const dropOffLabel = ride.destination?.name ?? ride.destination?.address ?? '—';
  const showDiscount = discountAmount != null && discountAmount > 0;

  const handlePdfPress = () => {
    if (onDownloadPdf) {
      onDownloadPdf();
    } else {
      Alert.alert(
        'Bientôt disponible / Coming soon',
        'Le téléchargement PDF sera disponible dans une prochaine mise à jour.\n\nPDF download will be available in a future update.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.outer}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top torn edge ── */}
      <ScallopEdge width={cardWidth} side="top" fill={hostBackgroundColor} />

      {/* ── Card body ── */}
      <View style={styles.card}>
        {/* Driver header */}
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

        {/* Address sections */}
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

        {/* Trip fare */}
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

          {showDiscount ? (
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Remise</Text>
              <Text style={[styles.fareValue, styles.discountValue]}>-{formatXOF(discountAmount)}</Text>
            </View>
          ) : null}

          <View style={styles.amountPaidDivider} />

          <View style={styles.fareRow}>
            <Text style={styles.amountPaidLabel}>Amount Paid</Text>
            <Text style={styles.amountPaidValue}>{formatXOF(ride.fare?.total)}</Text>
          </View>
        </View>

        {/* PDF stub */}
        <TouchableOpacity
          onPress={handlePdfPress}
          style={styles.pdfRow}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel="Download PDF"
        >
          <Text style={styles.pdfLink}>Télécharger le PDF / Download PDF</Text>
        </TouchableOpacity>
      </View>

      {/* ── Bottom torn edge ── */}
      <ScallopEdge width={cardWidth} side="bottom" fill={hostBackgroundColor} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  outer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  scallopTop: {
    marginBottom: -1,
  },
  scallopBottom: {
    marginTop: -1,
  },

  // Card body — no top/bottom borderRadius (handled by scallop edges)
  card: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
    gap: DRIVER_DETAILS_GAP,
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
    gap: SECTION_GAP,
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
    paddingVertical: FARE_ROW_VERTICAL_PADDING,
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
  discountValue: {
    color: colors.success,
  },

  // PDF link
  pdfRow: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  pdfLink: {
    ...typography.bodySmall,
    color: colors.primary.main,
    textDecorationLine: 'underline',
  },
});
