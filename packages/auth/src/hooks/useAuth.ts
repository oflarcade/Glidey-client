import { useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseAuth, getFirebaseFunctions } from '../firebase';
import { useAuthStore } from '../store';
import type {
  AuthUser,
  RegisterClientParams,
  RegisterDriverParams,
  LoginParams,
} from '../types';

/**
 * Map Firebase Auth error codes to user-friendly messages
 */
function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred. Please try again.';
  }

  const message = error.message.toLowerCase();
  
  // Extract Firebase error code from message
  // Firebase errors are in format: "Firebase: Error (auth/error-code)."
  const codeMatch = message.match(/\(auth\/([^)]+)\)/);
  const errorCode = codeMatch ? codeMatch[1] : '';

  switch (errorCode) {
    // Login errors
    case 'invalid-credential':
    case 'invalid-email':
    case 'wrong-password':
    case 'user-not-found':
      return 'Invalid email or password. Please check your credentials and try again.';
    
    case 'user-disabled':
      return 'This account has been disabled. Please contact support.';
    
    case 'too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes before trying again.';
    
    // Registration errors
    case 'email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    
    case 'weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    
    case 'operation-not-allowed':
      return 'Email/password sign-in is not enabled. Please contact support.';
    
    // Network errors
    case 'network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    
    // Timeout
    case 'timeout':
      return 'The request timed out. Please try again.';
    
    // Account errors
    case 'requires-recent-login':
      return 'For security, please sign in again to complete this action.';
    
    default:
      // Check for common error patterns in the message
      if (message.includes('network')) {
        return 'Network error. Please check your internet connection.';
      }
      if (message.includes('timeout')) {
        return 'The request timed out. Please try again.';
      }
      if (message.includes('internal')) {
        return 'A server error occurred. Please try again later.';
      }
      
      // Return original message if no match (but clean it up)
      return error.message.replace(/Firebase: /i, '').replace(/\(auth\/[^)]+\)\./i, '').trim() 
        || 'An error occurred. Please try again.';
  }
}

/**
 * Main auth hook for email/password authentication
 */
export function useAuth() {
  const {
    user,
    profile,
    isAuthenticated,
    isLoading,
    isInitialized,
    appType,
    setUser,
    setProfile,
    setLoading,
    setInitialized,
    logout: storeLogout,
  } = useAuthStore();
  const isDemoMode = process.env.EXPO_PUBLIC_USE_DEMO === 'true';

  // Listen to auth state changes
  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const authUser = mapFirebaseUser(firebaseUser);
        setUser(authUser);

        // Fetch user profile (non-blocking)
        // Profile might not exist for new users or if Cloud Functions aren't deployed
        try {
          const functions = getFirebaseFunctions();
          const getUserProfile = httpsCallable(functions, 'getUserProfile');
          const result = await getUserProfile({ userType: appType });
          const response = result.data as { success: boolean; data: unknown };

          if (response.success && response.data) {
            setProfile(response.data as typeof profile);
          }
        } catch (error) {
          // Extract error details for debugging
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorCode = (error as { code?: string })?.code || 'unknown';
          
          // Handle expected errors gracefully without alarming logs
          if (errorCode === 'functions/not-found' || errorMessage.includes('not-found')) {
            // New user without profile - this is expected
            console.log('[Auth] Profile not found - user may need to complete registration');
          } else if (errorCode === 'functions/internal' || errorMessage.includes('internal')) {
            // Cloud Functions not deployed or emulator not running
            // This is common in development - log at debug level
            console.log('[Auth] Cloud Functions unavailable (functions/internal) - using local profile if available');
          } else if (errorCode === 'functions/unavailable' || errorMessage.includes('unavailable')) {
            // Network/connectivity issue
            console.log('[Auth] Cloud Functions unreachable - check network or emulator status');
          } else {
            // Unexpected error - warn for debugging
            console.warn('[Auth] Profile fetch failed:', { code: errorCode, message: errorMessage });
          }
          
          // Don't block auth state - profile can be fetched/created later
          // The profile state will remain from registration if it was set there
        }
      } else {
        if (isDemoMode && isAuthenticated && user) {
          setInitialized(true);
          return;
        }

        setUser(null);
        setProfile(null);
      }

      setInitialized(true);
    });

    return () => unsubscribe();
  }, [appType, isAuthenticated, isDemoMode, setUser, setProfile, setInitialized, user]);

  // Login with email/password
  const login = useCallback(
    async (params: LoginParams) => {
      setLoading(true);
      try {
        const auth = getFirebaseAuth();
        const result = await signInWithEmailAndPassword(
          auth,
          params.email,
          params.password
        );

        const authUser = mapFirebaseUser(result.user);
        setUser(authUser);

        // Fetch profile (non-blocking - don't fail login if profile fetch fails)
        // Profile might not exist for new users or if Cloud Functions aren't deployed
        try {
          const functions = getFirebaseFunctions();
          const getUserProfile = httpsCallable(functions, 'getUserProfile');
          const profileResult = await getUserProfile({ userType: appType });
          const response = profileResult.data as { success: boolean; data: unknown };

          if (response.success && response.data) {
            setProfile(response.data as typeof profile);
          }
        } catch (profileError) {
          // Extract error details for debugging
          const errorMessage = profileError instanceof Error ? profileError.message : 'Unknown error';
          const errorCode = (profileError as { code?: string })?.code || 'unknown';
          
          // Handle expected errors gracefully
          if (errorCode === 'functions/internal' || errorCode === 'functions/unavailable') {
            // Cloud Functions not deployed or emulator not running - common in dev
            console.log('[Login] Cloud Functions unavailable - profile will be fetched later');
          } else {
            console.warn('[Login] Profile fetch failed:', { code: errorCode, message: errorMessage });
          }
          
          // Don't fail login - profile can be fetched later
        }

        return { success: true, user: authUser };
      } catch (error: unknown) {
        console.error('[Login] Error:', error);
        const errorMessage = getAuthErrorMessage(error);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [appType, setUser, setProfile, setLoading]
  );

  // Register new client
  const registerClient = useCallback(
    async (params: RegisterClientParams) => {
      setLoading(true);
      try {
        const auth = getFirebaseAuth();
        const result = await createUserWithEmailAndPassword(
          auth,
          params.email,
          params.password
        );

        const authUser = mapFirebaseUser(result.user);

        // Create profile in Firestore via Cloud Function
        // If Cloud Function fails, we still have a valid Firebase Auth user
        // and can create/update the profile later
        try {
          const functions = getFirebaseFunctions();
          const createClientProfile = httpsCallable(functions, 'createClientProfile');
          const profileResult = await createClientProfile({
            firstName: params.firstName,
            lastName: params.lastName,
            phone: params.phone,
          });
          
          const response = profileResult.data as { success: boolean; data: unknown };
          if (response.success && response.data) {
            setProfile(response.data as typeof profile);
          }
        } catch (profileError) {
          // Log the actual error for debugging
          console.warn(
            '[Registration] Cloud Function createClientProfile failed:',
            profileError instanceof Error ? profileError.message : profileError
          );
          
          // For demo/development: create a local profile so the app continues to work
          // The profile will be synced/created on the backend later
          const localProfile = {
            id: result.user.uid,
            email: params.email,
            phone: params.phone || '',
            phoneVerified: false,
            firstName: params.firstName,
            lastName: params.lastName,
            role: 'client' as const,
          };
          setProfile(localProfile);
          console.log('[Registration] Created local profile as fallback');
        }

        setUser(authUser);
        return { success: true, user: authUser };
      } catch (error: unknown) {
        // Log the actual error for debugging
        console.error('[Registration] Error:', error);
        const errorMessage = getAuthErrorMessage(error);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [setUser, setProfile, setLoading]
  );

  // Register new driver
  const registerDriver = useCallback(
    async (params: RegisterDriverParams) => {
      setLoading(true);
      try {
        const auth = getFirebaseAuth();
        const result = await createUserWithEmailAndPassword(
          auth,
          params.email,
          params.password
        );

        const authUser = mapFirebaseUser(result.user);

        // Create driver profile in Firestore via Cloud Function
        // If Cloud Function fails, we still have a valid Firebase Auth user
        try {
          const functions = getFirebaseFunctions();
          const createDriverProfile = httpsCallable(functions, 'createDriverProfile');
          const profileResult = await createDriverProfile({
            firstName: params.firstName,
            lastName: params.lastName,
            phone: params.phone,
            vehicleInfo: params.vehicleInfo,
          });
          
          const response = profileResult.data as { success: boolean; data: unknown };
          if (response.success && response.data) {
            setProfile(response.data as typeof profile);
          }
        } catch (profileError) {
          // Log the actual error for debugging
          console.warn(
            '[Driver Registration] Cloud Function createDriverProfile failed:',
            profileError instanceof Error ? profileError.message : profileError
          );
          
          // For demo/development: create a local profile so the app continues to work
          const localProfile = {
            id: result.user.uid,
            email: params.email,
            phone: params.phone,
            phoneVerified: false,
            firstName: params.firstName,
            lastName: params.lastName,
            role: 'driver' as const,
            isOnline: false,
            isAvailable: false,
            vehicleInfo: {
              type: 'scooter' as const,
              licensePlate: params.vehicleInfo.licensePlate,
              model: params.vehicleInfo.model,
              color: params.vehicleInfo.color,
            },
            rating: { average: 5.0, count: 0 },
            documentsVerified: false,
          };
          setProfile(localProfile);
          console.log('[Driver Registration] Created local profile as fallback');
        }

        setUser(authUser);
        return { success: true, user: authUser, requiresPhoneVerification: true };
      } catch (error: unknown) {
        // Log the actual error for debugging
        console.error('[Driver Registration] Error:', error);
        const errorMessage = getAuthErrorMessage(error);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [setUser, setProfile, setLoading]
  );

  // Logout
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      storeLogout();
      return { success: true };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Logout failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [storeLogout, setLoading]);

  return {
    user,
    profile,
    isAuthenticated,
    isLoading,
    isInitialized,
    login,
    registerClient,
    registerDriver,
    logout,
  };
}

// Helper to map Firebase User to our AuthUser type
function mapFirebaseUser(firebaseUser: FirebaseUser): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    phoneNumber: firebaseUser.phoneNumber,
    emailVerified: firebaseUser.emailVerified,
  };
}
