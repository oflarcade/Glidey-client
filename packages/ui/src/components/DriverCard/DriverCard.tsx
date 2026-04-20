import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Avatar } from '../Avatar';
import { StarRating } from '../StarRating';
import { borderRadius, colors, spacing } from '../../theme';

export interface DriverCardProps {
  name: string;
  vehiclePlate: string;
  vehicleType: string;
  rating: number;
  completedRides: number;
  profilePhoto?: string;
  style?: ViewStyle;
}

const AVATAR_BG_COLORS = [
  '#4F86C6',
  '#6BAF92',
  '#C47A5A',
  '#8E72B2',
  '#C45A7A',
  '#5A9EC4',
  '#B2A042',
];

function avatarBgColor(name: string): string {
  return AVATAR_BG_COLORS[name.charCodeAt(0) % AVATAR_BG_COLORS.length];
}

export function DriverCard({
  name,
  vehiclePlate,
  vehicleType,
  rating,
  completedRides,
  profilePhoto,
  style,
}: DriverCardProps) {
  const avatarSource = profilePhoto ? { uri: profilePhoto } : null;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <View style={[styles.avatarWrapper, { backgroundColor: avatarBgColor(name) }]}>
          <Avatar source={avatarSource} name={name} size="large" />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.vehicleType}>{vehicleType}</Text>
          <StarRating rating={rating} showValue size={14} />
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.bottomRow}>
        <View style={styles.plateBadge}>
          <Text style={styles.plateText}>{vehiclePlate}</Text>
        </View>
        <Text style={styles.ridesText}>{completedRides} rides</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarWrapper: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  vehicleType: {
    fontSize: 13,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  plateBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.sm,
  },
  plateText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  ridesText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
});
