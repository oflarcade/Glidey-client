/**
 * NotificationItem Component Types
 * RentAScooter Design System
 */

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationItemProps {
  /** Unique identifier for the notification */
  id: string;
  /** Notification type determines icon and color */
  type: NotificationType;
  /** Title text (e.g., "System") */
  title: string;
  /** Message content */
  message: string;
  /** Optional timestamp */
  timestamp?: Date | string;
  /** Whether the notification has been read */
  isRead?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Test ID for testing */
  testID?: string;
}

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp?: Date | string;
  isRead?: boolean;
}
