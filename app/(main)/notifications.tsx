import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { TopBar, Icon, NotificationItem } from '@rentascooter/ui';
import type { NotificationData } from '@rentascooter/ui';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@rentascooter/i18n';
import { listNotifications, markNotificationRead } from '@/services/notificationsService';

const NOTIFICATION_FETCH_LIMIT = 20;

function EmptyNotifications({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{title}</Text>
      <Text style={styles.emptySubtext}>{subtitle}</Text>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const loadNotifications = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setHasError(false);
    try {
      const items = await listNotifications({ limit: NOTIFICATION_FETCH_LIMIT });
      setNotifications(items);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleNotificationPress = useCallback(async (notification: NotificationData) => {
    if (notification.isRead) return;
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
    try {
      await markNotificationRead(notification.id);
    } catch {
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: false } : n)));
    }
  }, []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const renderNotification = useCallback(
    ({ item }: { item: NotificationData }) => (
      <NotificationItem
        id={item.id}
        type={item.type}
        title={item.title}
        message={item.message}
        timestamp={item.timestamp}
        isRead={item.isRead}
        onPress={() => handleNotificationPress(item)}
        testID={`notification-${item.id}`}
      />
    ),
    [handleNotificationPress]
  );

  const keyExtractor = useCallback((item: NotificationData) => item.id, []);

  return (
    <View style={styles.container}>
      <TopBar
        title={t('profile.notifications')}
        leftAction={
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Icon name="chevron-left" size="md" color={colors.text.primary} />
          </TouchableOpacity>
        }
      />
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={colors.primary.main} />
        </View>
      ) : null}
      {hasError ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{t('notifications.error_loading')}</Text>
        </View>
      ) : null}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={keyExtractor}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading && !hasError ? (
            <EmptyNotifications
              title={t('notifications.empty_title')}
              subtitle={t('notifications.empty_subtitle')}
            />
          ) : null
        }
        refreshing={isLoading}
        onRefresh={loadNotifications}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  backButton: {
    padding: spacing.xs,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  loaderContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorState: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.semantic.error,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
