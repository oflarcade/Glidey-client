/**
 * Mock nearby drivers for emulator / dev when the real API returns no drivers.
 * Only used in __DEV__ so production always uses real data.
 */

import type { NearbyDriver } from '@rentascooter/shared';

const OFFSETS: Array<[number, number]> = [
  [0.0015, 0],
  [-0.001, 0.0012],
  [-0.0008, -0.001],
  [0.0012, 0.0009],
  [0.0005, -0.0015],
  [-0.0012, -0.0005],
];

const NAMES = ['Moussa D.', 'Fatou N.', 'Ibrahima S.', 'Aissatou B.', 'Omar G.', 'Kadiatou C.'];

export function getMockDriversNear(latitude: number, longitude: number): NearbyDriver[] {
  return OFFSETS.map(([dLat, dLng], i) => ({
    id: `mock-driver-${i + 1}`,
    name: NAMES[i],
    vehicleType: 'scooter',
    vehiclePlate: `DK-${1000 + i * 111}-X`,
    rating: 4 + (i % 5) / 5,
    distanceM: 150 + i * 80,
    latitude: latitude + dLat,
    longitude: longitude + dLng,
  }));
}
