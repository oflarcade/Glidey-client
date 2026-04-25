import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import NotificationsScreen from './notifications';

const mockBack = jest.fn();
const mockListNotifications = jest.fn();
const mockMarkNotificationRead = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

jest.mock('@/services/notificationsService', () => ({
  listNotifications: (...args: unknown[]) => mockListNotifications(...args),
  markNotificationRead: (...args: unknown[]) => mockMarkNotificationRead(...args),
}));

jest.mock('@rentascooter/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@rentascooter/ui', () => {
  const React = require('react');
  const { Text, View, Pressable } = require('react-native');
  return {
    TopBar: ({ title, leftAction }: { title: string; leftAction?: React.ReactNode }) => (
      <View>
        <Text>{title}</Text>
        {leftAction}
      </View>
    ),
    Icon: () => <Text>icon</Text>,
    NotificationItem: ({
      title,
      onPress,
      testID,
    }: {
      title: string;
      onPress?: () => void;
      testID?: string;
    }) => (
      <Pressable onPress={onPress} testID={`${testID}-pressable`}>
        <Text>{title}</Text>
      </Pressable>
    ),
  };
});

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and renders notifications from the API', async () => {
    mockListNotifications.mockResolvedValueOnce([
      {
        id: 'notif-1',
        type: 'info',
        title: 'System',
        message: 'Welcome',
        isRead: false,
      },
    ]);

    const { getByText } = render(<NotificationsScreen />);

    await waitFor(() => {
      expect(getByText('System')).toBeTruthy();
    });

    expect(mockListNotifications).toHaveBeenCalledWith({ limit: 20 });
  });

  it('marks unread notifications as read when pressed', async () => {
    mockListNotifications.mockResolvedValueOnce([
      {
        id: 'notif-2',
        type: 'info',
        title: 'Ride update',
        message: 'Driver is arriving',
        isRead: false,
      },
    ]);
    mockMarkNotificationRead.mockResolvedValueOnce(undefined);

    const { getByTestId } = render(<NotificationsScreen />);

    await waitFor(() => {
      expect(getByTestId('notification-notif-2-pressable')).toBeTruthy();
    });

    fireEvent.press(getByTestId('notification-notif-2-pressable'));

    await waitFor(() => {
      expect(mockMarkNotificationRead).toHaveBeenCalledWith('notif-2');
    });
  });
});
