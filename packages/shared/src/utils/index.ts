import { GeoPoint, RideFare, RouteInfo } from '../types';
import { FARE_CONFIG } from '../constants';

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(from: GeoPoint, to: GeoPoint): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (from.latitude * Math.PI) / 180;
  const φ2 = (to.latitude * Math.PI) / 180;
  const Δφ = ((to.latitude - from.latitude) * Math.PI) / 180;
  const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate fare based on route information
 */
export function calculateFare(route: RouteInfo): RideFare {
  const distanceKm = route.distanceM / 1000;
  const durationMinutes = route.durationS / 60;

  const baseFare = FARE_CONFIG.BASE_FARE;
  const distanceFare = Math.round(distanceKm * FARE_CONFIG.PER_KM_RATE);
  const timeFare = Math.round(durationMinutes * FARE_CONFIG.PER_MINUTE_RATE);

  const calculatedTotal = baseFare + distanceFare + timeFare;
  const total = Math.max(calculatedTotal, FARE_CONFIG.MIN_FARE);

  return {
    baseFare,
    distanceFare,
    timeFare,
    total,
    currency: FARE_CONFIG.CURRENCY,
  };
}

/**
 * Format fare amount for display
 */
export function formatFare(amount: number): string {
  return `${amount.toLocaleString('fr-SN')} FCFA`;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Calculate estimated arrival time
 */
export function getETA(durationSeconds: number): Date {
  return new Date(Date.now() + durationSeconds * 1000);
}

/**
 * Format phone number for Senegal
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Handle Senegal numbers
  if (digits.startsWith('221')) {
    const local = digits.slice(3);
    return `+221 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
  }

  if (digits.length === 9) {
    return `+221 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
  }

  return phone;
}

/**
 * Validate Senegal phone number
 */
export function isValidSenegalPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  // Senegal numbers: 9 digits starting with 7 (mobile)
  if (digits.length === 9 && digits.startsWith('7')) {
    return true;
  }
  // With country code
  if (digits.length === 12 && digits.startsWith('221') && digits[3] === '7') {
    return true;
  }
  return false;
}

/**
 * Generate a random OTP code
 */
export function generateOTP(length: number = 6): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

/**
 * Calculate driver rating average
 */
export function calculateRatingAverage(
  currentAverage: number,
  currentCount: number,
  newRating: number
): { average: number; count: number } {
  const newCount = currentCount + 1;
  const newAverage = (currentAverage * currentCount + newRating) / newCount;
  return {
    average: Math.round(newAverage * 10) / 10, // Round to 1 decimal
    count: newCount,
  };
}
