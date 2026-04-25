import { renderHook, waitFor } from '@testing-library/react-native';
import { onAuthStateChanged } from 'firebase/auth';

import { useAuth } from './useAuth';

const mockStore = {
  user: null as null | { uid: string; email: string | null },
  profile: null as null | { firstName: string },
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  appType: 'client' as const,
  setUser: jest.fn(),
  setProfile: jest.fn(),
  setLoading: jest.fn(),
  setInitialized: jest.fn(),
  logout: jest.fn(),
};

const mockAuth = {};
const mockUnsubscribe = jest.fn();

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(),
}));

jest.mock('../firebase', () => ({
  getFirebaseAuth: jest.fn(() => mockAuth),
  getFirebaseFunctions: jest.fn(() => ({})),
}));

jest.mock('../store', () => ({
  useAuthStore: jest.fn(() => mockStore),
}));

describe('useAuth', () => {
  const originalDemoMode = process.env.EXPO_PUBLIC_USE_DEMO;

  beforeEach(() => {
    jest.clearAllMocks();
    (onAuthStateChanged as jest.Mock).mockImplementation(
      (_auth: unknown, callback: (user: unknown) => void) => {
        callback(null);
        return mockUnsubscribe;
      }
    );
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_USE_DEMO = originalDemoMode;
  });

  it('keeps persisted auth state in demo mode when Firebase returns null user', async () => {
    process.env.EXPO_PUBLIC_USE_DEMO = 'true';
    mockStore.user = { uid: 'demo_driver_221775551234', email: null };
    mockStore.isAuthenticated = true;

    renderHook(() => useAuth());

    await waitFor(() => {
      expect(mockStore.setInitialized).toHaveBeenCalledWith(true);
    });
    expect(mockStore.setUser).not.toHaveBeenCalledWith(null);
    expect(mockStore.setProfile).not.toHaveBeenCalledWith(null);
  });

  it('clears auth state when not in demo mode and Firebase returns null user', async () => {
    process.env.EXPO_PUBLIC_USE_DEMO = 'false';
    mockStore.user = { uid: 'uid-1', email: 'test@example.com' };
    mockStore.isAuthenticated = true;

    renderHook(() => useAuth());

    await waitFor(() => {
      expect(mockStore.setUser).toHaveBeenCalledWith(null);
    });
    expect(mockStore.setProfile).toHaveBeenCalledWith(null);
    expect(mockStore.setInitialized).toHaveBeenCalledWith(true);
  });
});
