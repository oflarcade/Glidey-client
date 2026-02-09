export type AppType = 'client' | 'driver';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  phoneVerified: boolean;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

export interface ClientProfile extends UserProfile {
  role: 'client';
}

export interface DriverProfile extends UserProfile {
  role: 'driver';
  isOnline: boolean;
  isAvailable: boolean;
  vehicleInfo: {
    type: 'scooter';
    licensePlate: string;
    model?: string;
    color?: string;
  };
  rating: {
    average: number;
    count: number;
  };
  documentsVerified: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  appType: AppType;
}

export interface RegisterClientParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface RegisterDriverParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  vehicleInfo: {
    licensePlate: string;
    model?: string;
    color?: string;
  };
}

export interface CompleteDriverProfileParams {
  firstName: string;
  lastName: string;
  vehicleInfo: {
    licensePlate: string;
    model?: string;
    color?: string;
  };
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface PhoneLoginParams {
  phone: string;
}

export interface VerifyOTPParams {
  phone: string;
  otp: string;
}
