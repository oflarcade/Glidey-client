import React from 'react';
import { render } from '@testing-library/react-native';

import TripReceiptScreen from './[rideId]';

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({ rideId: 'ride-123', entryPoint: 'history' }),
}));

jest.mock('@rentascooter/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@rentascooter/ui', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Icon: () => <Text>icon</Text>,
  };
});

jest.mock('@/hooks/useRideHistory', () => ({
  useRideHistory: () => ({
    rides: [
      {
        id: 'ride-123',
        status: 'completed',
        pickup: { address: 'Plateau' },
        destination: { address: 'Almadies' },
        timestamps: { completedAt: new Date('2026-01-01T10:00:00Z') },
        fare: { baseFare: 500, distanceFare: 300, timeFare: 200, total: 1000, currency: 'XOF' },
      },
    ],
    isLoading: false,
  }),
}));

jest.mock('@rentascooter/shared', () => ({
  useRideStore: (selector: (s: { reset: () => void; matchedDriver: null; journey: null }) => unknown) =>
    selector({ reset: jest.fn(), matchedDriver: null, journey: null }),
}));

jest.mock('@/components/TripReceipt', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    TripReceipt: () => <Text>trip-receipt-content</Text>,
  };
});

jest.mock('@/components/RatingModal', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    RatingModal: ({ visible }: { visible: boolean }) =>
      visible ? <Text>rating-modal-visible</Text> : <Text>rating-modal-hidden</Text>,
  };
});

describe('TripReceiptScreen', () => {
  it('renders trip receipt content for history entry point', () => {
    const { getByText, queryByText } = render(<TripReceiptScreen />);

    expect(getByText('trip-receipt-content')).toBeTruthy();
    expect(queryByText('rating-modal-visible')).toBeNull();
  });
});
