import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { colors, spacing, typography, borderRadius } from '../../theme';
import type { NotificationItemProps, NotificationType } from './types';

/**
 * @description Props for the NotificationItem component
 *
 * @acceptance AC-NTF-001: NotificationItem displays colored circular icon based on type
 * @acceptance AC-NTF-002: Success type shows blue circle with white checkmark
 * @acceptance AC-NTF-003: Error type shows red circle with white X
 * @acceptance AC-NTF-004: Info type shows yellow/green circle with message icon
 * @acceptance AC-NTF-005: Warning type shows orange circle with alert icon
 * @acceptance AC-NTF-006: Title displays in bold (medium weight)
 * @acceptance AC-NTF-007: Message truncates with ellipsis on single line
 * @acceptance AC-NTF-008: Press feedback reduces opacity to 0.7
 * @acceptance AC-NTF-009: Unread notifications have subtle highlight
 */

// Icon size for the circular background
const ICON_SIZE = 40;
const ICON_INNER_SIZE = 20;

// Color mapping for notification types
const typeColors: Record<NotificationType, string> = {
  success: '#3B82F6', // Blue (matches Figma design)
  error: '#E31B23', // Red (brand)
  info: '#FECB00', // Yellow (brand)
  warning: '#FF8A00', // Orange (secondary)
};

// Icon components for each type
const CheckIcon = ({ color }: { color: string }) => (
  <Svg width={ICON_INNER_SIZE} height={ICON_INNER_SIZE} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17L4 12"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const XIcon = ({ color }: { color: string }) => (
  <Svg width={ICON_INNER_SIZE} height={ICON_INNER_SIZE} viewBox="0 0 24 24" fill="none">
    <Line x1={18} y1={6} x2={6} y2={18} stroke={color} strokeWidth={3} strokeLinecap="round" />
    <Line x1={6} y1={6} x2={18} y2={18} stroke={color} strokeWidth={3} strokeLinecap="round" />
  </Svg>
);

const MessageIcon = ({ color }: { color: string }) => (
  <Svg width={ICON_INNER_SIZE} height={ICON_INNER_SIZE} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AlertIcon = ({ color }: { color: string }) => (
  <Svg width={ICON_INNER_SIZE} height={ICON_INNER_SIZE} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
    <Line x1={12} y1={8} x2={12} y2={12} stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx={12} cy={16} r={1} fill={color} />
  </Svg>
);

// Get icon component for notification type
const getIconComponent = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return CheckIcon;
    case 'error':
      return XIcon;
    case 'info':
      return MessageIcon;
    case 'warning':
      return AlertIcon;
  }
};

/**
 * NotificationItem Component
 *
 * Displays a single notification row with icon, title, and message.
 * Used in notification lists for both client and driver apps.
 *
 * @example
 * ```tsx
 * <NotificationItem
 *   id="1"
 *   type="success"
 *   title="System"
 *   message="Booking #1234 has been successfully confirmed"
 *   timestamp={new Date()}
 *   onPress={() => handleNotificationPress()}
 * />
 * ```
 */
export function NotificationItem({
  id,
  type,
  title,
  message,
  timestamp,
  isRead = true,
  onPress,
  testID,
}: NotificationItemProps) {
  const backgroundColor = typeColors[type];
  const IconComponent = getIconComponent(type);

  const content = (
    <View
      style={[
        styles.container,
        !isRead && styles.unreadContainer,
      ]}
      testID={testID}
    >
      {/* Icon Circle */}
      <View style={[styles.iconCircle, { backgroundColor }]}>
        <IconComponent color="#FFFFFF" />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.message} numberOfLines={1} ellipsizeMode="tail">
          {message}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
        testID={testID ? `${testID}-pressable` : undefined}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  unreadContainer: {
    backgroundColor: colors.background.secondary,
  },

  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    flex: 1,
    marginLeft: spacing.md,
  },

  title: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },

  message: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },

  pressed: {
    opacity: 0.7,
  },
});
