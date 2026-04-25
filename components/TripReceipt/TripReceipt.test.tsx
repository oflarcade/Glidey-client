import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { TripReceipt } from './TripReceipt';
import type { Ride } from '@rentascooter/shared';

jest.mock('@rentascooter/ui', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return {
    Avatar: ({ name }: { name: string }) => <Text>{name}</Text>,
    Badge: ({ label }: { label: string }) => (
      <View>
        <Text>{label}</Text>
      </View>
    ),
  };
});

const rideFixture = {
  id: 'ride-123',
  pickup: { name: 'Point A', address: 'Dakar Plateau' },
  destination: { name: 'Point B', address: 'Almadies' },
  fare: {
    baseFare: 500,
    distanceFare: 300,
    timeFare: 200,
    total: 1000,
    currency: 'XOF',
  },
  route: { distanceM: 2400 },
  driverInfo: { firstName: 'Moussa', lastName: 'Diop', profilePicture: null },
} as unknown as Ride;

describe('TripReceipt', () => {
  it('renders pickup and drop-off details', () => {
    const { getByText } = render(<TripReceipt ride={rideFixture} />);

    expect(getByText('PICK UP')).toBeTruthy();
    expect(getByText('DROP OFF')).toBeTruthy();
    expect(getByText('Point A')).toBeTruthy();
    expect(getByText('Point B')).toBeTruthy();
  });

  it('calls onDownloadPdf when pressing download action', () => {
    const onDownloadPdf = jest.fn();
    const { getByLabelText } = render(
      <TripReceipt ride={rideFixture} onDownloadPdf={onDownloadPdf} />
    );

    fireEvent.press(getByLabelText('Download PDF'));
    expect(onDownloadPdf).toHaveBeenCalledTimes(1);
  });
});
