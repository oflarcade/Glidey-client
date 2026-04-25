import { authedFetch } from '@rentascooter/api';
import type { NotificationData, NotificationType } from '@rentascooter/ui';

const NOTIFICATIONS_LIMIT_DEFAULT = 20;
const NOTIFICATIONS_LIMIT_MIN = 1;
const NOTIFICATIONS_LIMIT_MAX = 100;
const NOTIFICATIONS_OFFSET_DEFAULT = 0;

export interface ListNotificationsParams {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

interface BackendNotification {
  id: string;
  title: string;
  body: string;
  data: Record<string, string> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface ListNotificationsResponse {
  notifications: BackendNotification[];
}

interface MarkNotificationReadResponse {
  notification: BackendNotification;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizeInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.trunc(value);
}

function mapNotificationType(data: Record<string, string> | null): NotificationType {
  const kind = data?.type;
  if (kind === 'success' || kind === 'error' || kind === 'warning' || kind === 'info') {
    return kind;
  }
  return 'info';
}

function toNotificationData(item: BackendNotification): NotificationData {
  return {
    id: item.id,
    type: mapNotificationType(item.data),
    title: item.title,
    message: item.body,
    timestamp: item.createdAt,
    isRead: item.isRead,
  };
}

export async function listNotifications(
  params: ListNotificationsParams = {},
): Promise<NotificationData[]> {
  const limit = clamp(
    sanitizeInteger(params.limit, NOTIFICATIONS_LIMIT_DEFAULT),
    NOTIFICATIONS_LIMIT_MIN,
    NOTIFICATIONS_LIMIT_MAX,
  );
  const offset = Math.max(
    NOTIFICATIONS_OFFSET_DEFAULT,
    sanitizeInteger(params.offset, NOTIFICATIONS_OFFSET_DEFAULT),
  );
  const unreadOnly = params.unreadOnly ?? false;

  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    unreadOnly: String(unreadOnly),
  });

  const result = await authedFetch('GET', `/notifications?${query.toString()}`);
  if (
    result &&
    typeof result === 'object' &&
    Array.isArray((result as ListNotificationsResponse).notifications)
  ) {
    return (result as ListNotificationsResponse).notifications.map(toNotificationData);
  }

  throw new Error('Failed to list notifications');
}

export async function markNotificationRead(notificationId: string): Promise<NotificationData> {
  const result = await authedFetch('PATCH', `/notifications/${notificationId}/read`);
  if (
    result &&
    typeof result === 'object' &&
    (result as MarkNotificationReadResponse).notification &&
    typeof (result as MarkNotificationReadResponse).notification === 'object'
  ) {
    return toNotificationData((result as MarkNotificationReadResponse).notification);
  }

  throw new Error('Failed to mark notification as read');
}

export type NotificationPlatform = 'ios' | 'android';

export async function savePushToken(token: string, platform: NotificationPlatform): Promise<void> {
  await authedFetch('POST', '/notifications/token', { token, platform });
}
