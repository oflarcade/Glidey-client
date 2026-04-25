import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import TripReceiptScreen from './[rideId]';

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockReset = jest.fn();
const mockSubmitRating = jest.fn();
let mockEntryPoint: 'history' | 'completion' = 'history';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({ rideId: 'ride-123', entryPoint: mockEntryPoint }),
}));

jest.mock('@rentascooter/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@rentascooter/ui', () => ({
  Icon: () => null,
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
        fare: { baseFare: 500, distanceFare: 300, timeFare: 200, total: 1000, currency: 'XOF' },
      },
    ],
    isLoading: false,
  }),
}));

jest.mock('@rentascooter/shared', () => ({
  useRideStore: (selector: (s: { reset: () => void; matchedDriver: null; journey: null }) => unknown) =>
    selector({ reset: mockReset, matchedDriver: null, journey: null }),
}));

jest.mock('@/components/TripReceipt', () => ({
  TripReceipt: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text>trip-receipt-content</Text>;
  },
}));

jest.mock('@/components/RatingModal', () => ({
  RatingModal: ({
    visible,
    onSubmit,
  }: {
    visible: boolean;
    onSubmit: (rating: number, comment?: string) => void;
  }) => {
    const React = require('react');
    const { Text, TouchableOpacity } = require('react-native');
    return visible ? (
      <TouchableOpacity onPress={() => onSubmit(5, 'Great ride')}>
        <Text>rating-modal-visible</Text>
      </TouchableOpacity>
    ) : (
      <Text>rating-modal-hidden</Text>
    );
  },
}));

jest.mock('@/services/ratingsService', () => ({
  submitRating: (...args: unknown[]) => mockSubmitRating(...args),
}));

describe('TripReceiptScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockEntryPoint = 'history';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders trip receipt content for history entry point', () => {
    const { getByText, queryByText } = render(<TripReceiptScreen />);

    expect(getByText('trip-receipt-content')).toBeTruthy();
    expect(queryByText('rating-modal-visible')).toBeNull();
  });

  it('shows alert and keeps rider on receipt when rating submit fails', async () => {
    mockEntryPoint = 'completion';
    mockSubmitRating.mockRejectedValueOnce(new Error('network error'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = render(<TripReceiptScreen />);
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    fireEvent.press(getByText('rating-modal-visible'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('common.error', 'errors.rating_submit_failed', [{ text: 'OK' }]);
    });
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
