import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { colors, spacing } from '@rentascooter/ui/theme';
import {
  TopBar,
  Icon,
  NotificationItem,
} from '@rentascooter/ui';
import type { NotificationData } from '@rentascooter/ui';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from '@rentascooter/i18n';

/**
 * Mock notification data for the client app
 */
const MOCK_NOTIFICATIONS: NotificationData[] = [
  {
    id: '1',
    type: 'success',
    title: 'System',
    message: 'Your ride #1234 has been successfully completed',
    timestamp: new Date(),
    isRead: false,
  },
  {
    id: '2',
    type: 'info',
    title: 'System',
    message: 'A driver is on the way to pick you up',
    timestamp: new Date(Date.now() - 3600000),
    isRead: true,
  },
  {
    id: '3',
    type: 'success',
    title: 'System',
    message: 'Thank you! Your payment of 1,500 XOF has been processed.',
    timestamp: new Date(Date.now() - 7200000),
    isRead: true,
  },
  {
    id: '4',
    type: 'warning',
    title: 'System',
    message: 'High demand in your area. Fares may be slightly higher.',
    timestamp: new Date(Date.now() - 86400000),
    isRead: true,
  },
  {
    id: '5',
    type: 'error',
    title: 'System',
    message: 'Your booking #1205 has been cancelled by the driver.',
    timestamp: new Date(Date.now() - 172800000),
    isRead: true,
  },
];

/**
 * Notifications Screen
 *
 * Displays client notifications and alerts in a list format.
 * Each notification shows type-specific icon, title, and message.
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationData[]>(MOCK_NOTIFICATIONS);

  const handleNotificationPress = useCallback((notification: NotificationData) => {
    // Mark as read when pressed
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, isRead: true } : n
      )
    );
    // TODO: Navigate to notification detail or relevant screen
    console.log('Notification pressed:', notification.id);
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
        title={t('profile.notifications') || 'Notifications'}
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
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={keyExtractor}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
});
