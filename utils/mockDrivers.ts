/**
 * Mock nearby drivers for emulator / demo when the API returns no drivers.
 * Only used in __DEV__ so production always uses real data.
 */

import type { NearbyDriver } from '@rentascooter/shared';

/** Offsets (lat, lng) in approximate degrees ~100–400 m from center */
const OFFSETS: Array<[number, number]> = [
  [0.0015, 0],
  [-0.001, 0.0012],
  [-0.0008, -0.001],
  [0.0012, 0.0009],
  [0.0005, -0.0015],
  [-0.0012, -0.0005],
];

/**
 * Generate mock drivers around a given location for demo/emulator.
 * Used when real API returns empty so scooter pins are visible.
 */
export function getMockDriversNear(latitude: number, longitude: number): NearbyDriver[] {
  return OFFSETS.map(([dLat, dLng], i) => ({
    id: `mock-driver-${i + 1}`,
    location: {
      latitude: latitude + dLat,
      longitude: longitude + dLng,
    },
    vehicleType: 'scooter',
    vehicleColor: ['red', 'green', 'yellow', 'blue', 'white', 'black'][i],
    rating: 4 + (i % 5) / 5,
    distanceMeters: 150 + i * 80,
  }));
}
