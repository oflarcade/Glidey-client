import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '@rentascooter/ui/theme';
import { TopBar, Icon, NotificationItem } from '@rentascooter/ui';
import type { NotificationData } from '@rentascooter/ui';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from '@rentascooter/i18n';

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const handleNotificationPress = useCallback((notification: NotificationData) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
    );
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
            accessibilityLabel={t('common.back')}
          >
            <Icon name="chevron-left" size="md" color={colors.text.primary} />
          </TouchableOpacity>
        }
      />
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={keyExtractor}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('notifications.empty_title')}</Text>
            <Text style={styles.emptySubtext}>{t('notifications.empty_subtitle')}</Text>
          </View>
        }
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
