import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import RidesScreen from './rides';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

jest.mock('@rentascooter/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@rentascooter/ui', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  Badge: ({ label }: { label: string }) => <Text>{label}</Text>,
  StarRating: () => <Text>star-rating</Text>,
  TopBar: ({
    title,
    leftAction,
  }: {
    title: string;
    leftAction?: React.ReactNode;
  }) => (
    <View>
      <Text>{title}</Text>
      {leftAction}
    </View>
  ),
  Icon: () => <Text>icon</Text>,
}));

jest.mock('@/hooks/useRideHistory', () => ({
  useRideHistory: () => ({
    rides: [
      {
        id: 'ride-123',
        status: 'completed',
        pickup: { address: 'Plateau' },
        destination: { address: 'Almadies' },
        timestamps: { completedAt: new Date('2026-01-01T10:00:00Z') },
        driverInfo: { firstName: 'Moussa', lastName: 'Diop', rating: 4.8 },
        fare: { total: 1500, currency: 'XOF' },
      },
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    isRefetching: false,
  }),
}));

describe('RidesScreen', () => {
  it('navigates to trip receipt when a ride card is pressed', () => {
    const { getByLabelText } = render(<RidesScreen />);

    fireEvent.press(getByLabelText('client.trip_receipt'));
    expect(mockPush).toHaveBeenCalledWith('/trip-receipt/ride-123?entryPoint=history');
  });
});
