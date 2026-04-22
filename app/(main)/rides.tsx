import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useTranslation } from '@rentascooter/i18n';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Card, Badge, StarRating, TopBar, Icon } from '@rentascooter/ui';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { useRideHistory } from '@/hooks/useRideHistory';
import type { Ride } from '@rentascooter/shared';

function formatRideDateTime(timestamps: Ride['timestamps']): { date: string; time: string } {
  const raw =
    (timestamps.completedAt as Date | string | undefined) ??
    (timestamps.startedAt as Date | string | undefined) ??
    (timestamps.requestedAt as Date | string | undefined);
  if (!raw) return { date: '—', time: '—' };
  const d = typeof raw === 'string' ? new Date(raw) : raw;
  const date = d.toLocaleDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

export default function RidesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { rides, isLoading, error, refetch, isRefetching } = useRideHistory({ limit: 20 });

  const handleRidePress = useCallback(
    (rideId: string) => {
      router.push(`/trip-receipt/${rideId}?entryPoint=history` as never);
    },
    [router]
  );

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderRide = useCallback(
    ({ item }: { item: Ride }) => {
      const { date, time } = formatRideDateTime(item.timestamps);
      const isCompleted = item.status === 'completed';
      const driverName =
        item.driverInfo?.firstName && item.driverInfo?.lastName
          ? `${item.driverInfo.firstName} ${item.driverInfo.lastName.charAt(0)}.`
          : '—';
      const rating = item.rating?.clientToDriver ?? item.driverInfo?.rating ?? 0;

      return (
        <TouchableOpacity onPress={() => handleRidePress(item.id)} activeOpacity={0.7}>
        <Card variant="elevated" padding="medium" style={styles.rideCard}>
          <View style={styles.rideHeader}>
            <Text style={styles.rideDate}>{date} {t('time.at')} {time}</Text>
            <Badge
              label={isCompleted ? t('client.completed') : t('client.cancelled')}
              variant={isCompleted ? 'success' : 'error'}
              size="small"
            />
          </View>

          <View style={styles.rideRoute}>
            <View style={styles.routePoint}>
              <View style={[styles.dot, styles.dotGreen]} />
              <Text style={styles.routeText} numberOfLines={1}>{item.pickup?.address ?? '—'}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <View style={[styles.dot, styles.dotRed]} />
              <Text style={styles.routeText} numberOfLines={1}>{item.destination?.address ?? '—'}</Text>
            </View>
          </View>

          <View style={styles.rideFooter}>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driverName}</Text>
              <StarRating rating={rating} size={14} />
            </View>
            <Text style={styles.fare}>
              {item.fare?.total != null ? `${Number(item.fare.total).toLocaleString()} ${item.fare.currency ?? 'XOF'}` : '—'}
            </Text>
          </View>
        </Card>
        </TouchableOpacity>
      );
    },
    [t, handleRidePress]
  );

  return (
    <View style={styles.container}>
      <TopBar
        title={t('client.my_rides') || 'My Rides'}
        leftAction={
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Icon name="chevron-left" size="md" color={colors.text.primary} />
          </TouchableOpacity>
        }
      />

      {error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          renderItem={renderRide}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={colors.primary.main}
            />
          }
          ListEmptyComponent={
            isLoading ? null : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{t('client.no_rides_yet')}</Text>
                <Text style={styles.emptySubtext}>{t('client.ride_history_appears_here')}</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  backButton: {
    padding: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  rideCard: {
    marginBottom: spacing.sm,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rideDate: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  rideRoute: {
    marginBottom: spacing.md,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: colors.background.tertiary,
    marginLeft: 5,
    marginVertical: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotGreen: {
    backgroundColor: colors.success,
  },
  dotRed: {
    backgroundColor: colors.accent.main,
  },
  routeText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
    paddingTop: spacing.md,
  },
  driverInfo: {
    gap: 4,
  },
  driverName: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '500',
  },
  fare: {
    ...typography.h3,
    color: colors.primary.main,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text.primary,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});
