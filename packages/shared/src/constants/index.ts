// Fare calculation constants (Senegal market - XOF)
export const FARE_CONFIG = {
  BASE_FARE: 500, // XOF - base fare
  PER_KM_RATE: 150, // XOF per kilometer
  PER_MINUTE_RATE: 25, // XOF per minute
  MIN_FARE: 750, // Minimum fare
  CURRENCY: 'XOF' as const,
} as const;

// Ride configuration
export const RIDE_CONFIG = {
  MAX_SEARCH_RADIUS_KM: 5, // Max distance to search for drivers
  DRIVER_TIMEOUT_SECONDS: 30, // Time for driver to accept
  ARRIVAL_RADIUS_METERS: 50, // Distance to consider "arrived"
} as const;

// Rating configuration
export const RATING_CONFIG = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  DEFAULT_RATING: 5,
} as const;

// Mapbox configuration
export const MAPBOX_CONFIG = {
  DEFAULT_CENTER: {
    latitude: 14.6937, // Dakar, Senegal
    longitude: -17.4441,
  },
  DEFAULT_ZOOM: 14,
  DRIVER_ZOOM: 16,
} as const;

// API endpoints (for Spring Boot migration later)
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_VERIFY_PHONE: '/auth/verify-phone',
  AUTH_SEND_OTP: '/auth/send-otp',
  AUTH_REFRESH: '/auth/refresh',

  // Rides
  RIDES_CREATE: '/rides',
  RIDES_GET: '/rides/:id',
  RIDES_LIST: '/rides',
  RIDES_ACCEPT: '/rides/:id/accept',
  RIDES_UPDATE_STATUS: '/rides/:id/status',
  RIDES_RATE: '/rides/:id/rating',
  RIDES_CANCEL: '/rides/:id/cancel',

  // Drivers
  DRIVERS_UPDATE_LOCATION: '/drivers/location',
  DRIVERS_GO_ONLINE: '/drivers/online',
  DRIVERS_GO_OFFLINE: '/drivers/offline',
  DRIVERS_AVAILABLE: '/drivers/available',

  // Users
  USERS_PROFILE: '/users/me',
  USERS_UPDATE: '/users/me',
  USERS_UPLOAD_PHOTO: '/users/me/photo',
} as const;

// Firebase collections
export const COLLECTIONS = {
  CLIENTS: 'clients',
  DRIVERS: 'drivers',
  RIDES: 'rides',
  RATINGS: 'ratings',
} as const;

// App configuration
export const APP_CONFIG = {
  CLIENT_APP_NAME: 'RentAScooter',
  DRIVER_APP_NAME: 'RentAScooter Driver',
  SUPPORT_EMAIL: 'support@rentascooter.sn',
  SUPPORT_PHONE: '+221 XX XXX XX XX',
} as const;
