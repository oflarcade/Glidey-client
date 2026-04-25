import { getMatchingStatus } from './matchingService';

const mockAuthedFetch = jest.fn();
const mockResolveToken = jest.fn();
const mockIsApiError = jest.fn();

jest.mock('@rentascooter/api', () => ({
  authedFetch: (...args: unknown[]) => mockAuthedFetch(...args),
  resolveToken: (...args: unknown[]) => mockResolveToken(...args),
  isApiError: (...args: unknown[]) => mockIsApiError(...args),
  DEMO_MODE_ERROR: {
    code: 'DEMO_MODE',
    message: 'Demo mode active',
  },
  API_BASE_URL: 'https://api.example.com',
}));

describe('getMatchingStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hydrates matched driver from backend profile and tracking position', async () => {
    mockAuthedFetch
      .mockResolvedValueOnce({ id: 'ride-1', status: 'accepted' })
      .mockResolvedValueOnce({
        rideId: 'ride-1',
        driverId: 'driver-1',
        name: 'Moussa Diallo',
        photoUrl: null,
        vehicleType: 'Moto-taxi',
        vehiclePlate: 'DK-1234-A',
        rating: 4.8,
        totalTrips: 142,
      })
      .mockResolvedValueOnce({
        rideId: 'ride-1',
        driverLocation: { latitude: 14.695, longitude: -17.444 },
        etaSeconds: 180,
        timestamp: 1_717_341_000_000,
      });

    const result = await getMatchingStatus('ride-1');

    expect(result.state).toBe('matched');
    expect(result.driver).toEqual({
      id: 'driver-1',
      name: 'Moussa Diallo',
      vehiclePlate: 'DK-1234-A',
      vehicleType: 'Moto-taxi',
      rating: 4.8,
      completedRides: 142,
      profilePhoto: undefined,
      location: { latitude: 14.695, longitude: -17.444 },
      etaSeconds: 180,
    });
  });

  it('uses zeroed location when tracking endpoint is unavailable', async () => {
    mockAuthedFetch
      .mockResolvedValueOnce({ id: 'ride-2', status: 'accepted' })
      .mockResolvedValueOnce({
        rideId: 'ride-2',
        driverId: 'driver-2',
        name: 'Cheikh Ndiaye',
        photoUrl: 'https://cdn.example.com/driver-2.jpg',
        vehicleType: 'Scooter',
        vehiclePlate: 'DK-5678-B',
        rating: null,
        totalTrips: 12,
      })
      .mockRejectedValueOnce(new Error('tracking unavailable'));

    const result = await getMatchingStatus('ride-2');

    expect(result.state).toBe('matched');
    expect(result.driver).toEqual({
      id: 'driver-2',
      name: 'Cheikh Ndiaye',
      vehiclePlate: 'DK-5678-B',
      vehicleType: 'Scooter',
      rating: 0,
      completedRides: 12,
      profilePhoto: 'https://cdn.example.com/driver-2.jpg',
      location: { latitude: 0, longitude: 0 },
      etaSeconds: undefined,
    });
  });

  it('keeps backend driver payload when already valid', async () => {
    mockAuthedFetch.mockResolvedValueOnce({
      id: 'ride-3',
      status: 'accepted',
      driver: {
        id: 'driver-3',
        name: 'Awa Fall',
        vehiclePlate: 'DK-1111-C',
        vehicleType: 'Scooter',
        rating: 4.5,
        completedRides: 44,
        profilePhoto: 'https://cdn.example.com/driver-3.jpg',
        location: { latitude: 14.7, longitude: -17.45 },
        etaSeconds: 90,
      },
    });

    const result = await getMatchingStatus('ride-3');

    expect(result).toEqual({
      state: 'matched',
      driver: {
        id: 'driver-3',
        name: 'Awa Fall',
        vehiclePlate: 'DK-1111-C',
        vehicleType: 'Scooter',
        rating: 4.5,
        completedRides: 44,
        profilePhoto: 'https://cdn.example.com/driver-3.jpg',
        location: { latitude: 14.7, longitude: -17.45 },
        etaSeconds: 90,
      },
    });
    expect(mockAuthedFetch).toHaveBeenCalledTimes(1);
  });
});
