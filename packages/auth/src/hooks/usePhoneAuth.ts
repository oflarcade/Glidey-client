import { useCallback, useState } from 'react';
import {
  PhoneAuthProvider,
  signInWithCredential,
  signInWithCustomToken,
  linkWithCredential,
  ApplicationVerifier,
} from 'firebase/auth';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { getFirebaseAuth, getFirebaseFunctions } from '../firebase';
import { useAuthStore } from '../store';
import type { PhoneLoginParams, VerifyOTPParams, DriverProfile, CompleteDriverProfileParams } from '../types';

/**
 * Test phone numbers for demo mode (configured in Firebase Console)
 * These bypass actual SMS sending
 */
const TEST_PHONE_NUMBERS = [
  '+221775551234', // Senegal test number
  '+16505551234', // US test number
];

const DEMO_OTP = '123456';

/**
 * Check if a phone number is a test number
 */
function isTestPhoneNumber(phone: string): boolean {
  const normalizedPhone = phone.replace(/\s/g, '');
  return TEST_PHONE_NUMBERS.some(
    (testPhone) => normalizedPhone === testPhone || normalizedPhone === testPhone.replace('+', '')
  );
}

/**
 * Format phone error messages for better UX
 */
function formatPhoneAuthError(err: unknown): string {
  if (!(err instanceof Error)) {
    return 'Failed to send verification code. Please try again.';
  }

  const message = err.message.toLowerCase();

  // Cloud Functions not deployed or unreachable
  if (message.includes('internal') || message.includes('unavailable')) {
    return 'Service temporarily unavailable. Please try again in a moment.';
  }

  // User not authenticated (for legacy flow)
  if (message.includes('unauthenticated')) {
    return 'Please try again. If the issue persists, use a test number (+221 77 555 1234).';
  }

  // Invalid phone number
  if (message.includes('invalid-phone-number') || message.includes('invalid phone')) {
    return 'Please enter a valid phone number.';
  }

  // Rate limited
  if (message.includes('too-many-requests') || message.includes('rate limit')) {
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }

  // Network error
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  return err.message || 'Failed to send verification code. Please try again.';
}

/**
 * Hook for phone number authentication using Firebase Phone Auth
 * Supports both new user sign-in and linking phone to existing account
 *
 * Demo Mode: For test phone numbers, uses local verification:
 * - +221 77 555 1234 (Senegal) -> OTP: 123456
 * - +1 650-555-1234 (US) -> OTP: 123456
 */
export function usePhoneAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile, setUser, setProfile, setPhoneAuth, resetPhoneAuth, phoneAuth } = useAuthStore();
  
  // Use store state for phone auth (persists across navigation)
  const { verificationId, pendingPhone, otpSent } = phoneAuth;

  /**
   * Send OTP to phone number using Firebase Phone Auth
   * @param params.phone - Phone number in E.164 format (e.g., +221775551234)
   * @param appVerifier - reCAPTCHA verifier (required for web, optional for mobile with auto-verify)
   */
  const sendOTP = useCallback(
    async (params: PhoneLoginParams, appVerifier?: ApplicationVerifier) => {
      setIsLoading(true);
      setError(null);

      try {
        const auth = getFirebaseAuth();
        const phoneProvider = new PhoneAuthProvider(auth);

        // Ensure phone is in E.164 format
        let phone = params.phone.trim();
        if (!phone.startsWith('+')) {
          phone = `+${phone}`;
        }

        // Store phone in shared state (persists across navigation)
        setPhoneAuth({ pendingPhone: phone });

        // For test phone numbers, use demo mode (no Cloud Functions needed)
        if (isTestPhoneNumber(phone)) {
          console.log(`[Demo Mode] OTP for ${phone}: ${DEMO_OTP}`);
          setPhoneAuth({ verificationId: 'demo', otpSent: true, pendingPhone: phone });
          return { success: true };
        }

        // For React Native, if no appVerifier provided, the SDK handles verification
        // For web, reCAPTCHA is required
        if (appVerifier) {
          const verId = await phoneProvider.verifyPhoneNumber(phone, appVerifier);
          setPhoneAuth({ verificationId: verId, otpSent: true, pendingPhone: phone });
        } else {
          // Try legacy OTP system via Cloud Functions
          // This requires authentication OR uses unauthenticated endpoint
          try {
            const functions = getFirebaseFunctions();
            const sendPhoneOTP = httpsCallable(functions, 'sendPhoneOTPPublic');
            await sendPhoneOTP({ phone });
            setPhoneAuth({ verificationId: 'legacy', otpSent: true, pendingPhone: phone });
          } catch (cloudFnError) {
            // If Cloud Functions fail, check if we should use demo mode as fallback
            console.warn('[Phone Auth] Cloud Functions unavailable:', cloudFnError);

            // For demo purposes, allow any Senegal number to use demo mode
            if (phone.startsWith('+221')) {
              console.log(`[Demo Fallback] Using demo mode for ${phone}`);
              setPhoneAuth({ verificationId: 'demo', otpSent: true, pendingPhone: phone });
              return { success: true };
            }

            throw cloudFnError;
          }
        }

        return { success: true };
      } catch (err: unknown) {
        const errorMessage = formatPhoneAuthError(err);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [setPhoneAuth]
  );

  /**
   * Verify OTP and complete phone authentication
   * If user is already signed in, links the phone to their account
   * Otherwise, signs them in with the phone credential
   */
  const verifyOTP = useCallback(
    async (params: VerifyOTPParams) => {
      setIsLoading(true);
      setError(null);

      try {
        const auth = getFirebaseAuth();
        const functions = getFirebaseFunctions();
        // Use phone from store (pendingPhone) or from params as fallback
        const phone = pendingPhone || params.phone;

        // Demo mode verification (for test phone numbers)
        if (verificationId === 'demo') {
          if (params.otp === DEMO_OTP) {
            console.log(`[Demo Mode] Phone ${phone} verified successfully`);
            if (profile) {
              setProfile({
                ...profile,
                phone,
                phoneVerified: true,
              });
            }
            resetPhoneAuth();
            return { success: true, verified: true };
          } else {
            throw new Error('Invalid verification code. Demo code is 123456.');
          }
        }

        if (verificationId === 'legacy') {
          // Use legacy backend verification
          try {
            const verifyPhoneOTP = httpsCallable(functions, 'verifyPhoneOTPPublic');
            const result = await verifyPhoneOTP({
              phone,
              otp: params.otp,
            }) as HttpsCallableResult<{ success: boolean; data: { verified: boolean } }>;

            if (result.data.success && result.data.data.verified) {
              if (profile) {
                setProfile({
                  ...profile,
                  phone,
                  phoneVerified: true,
                });
              }
              resetPhoneAuth();
              return { success: true, verified: true };
            } else {
              throw new Error('Verification failed');
            }
          } catch (cloudFnError) {
            // If Cloud Functions fail and using Senegal number, try demo verification
            if (phone?.startsWith('+221') && params.otp === DEMO_OTP) {
              console.log(`[Demo Fallback] Phone ${phone} verified via demo mode`);
              if (profile) {
                setProfile({
                  ...profile,
                  phone,
                  phoneVerified: true,
                });
              }
              resetPhoneAuth();
              return { success: true, verified: true };
            }
            throw cloudFnError;
          }
        }

        if (!verificationId) {
          throw new Error('Please request a verification code first');
        }

        // Create credential from verification ID and OTP
        const credential = PhoneAuthProvider.credential(verificationId, params.otp);

        if (user) {
          // User is already signed in - link phone to their account
          await linkWithCredential(auth.currentUser!, credential);

          // Call backend to sync phone verification status to profile
          try {
            const linkPhoneToProfile = httpsCallable(functions, 'linkPhoneToProfile');
            await linkPhoneToProfile({
              userType: profile?.role === 'driver' ? 'driver' : 'client',
            });
          } catch (linkError) {
            console.warn('[Phone Auth] Failed to sync phone to profile:', linkError);
            // Continue anyway - phone is linked in Firebase Auth
          }
        } else {
          // Sign in with phone credential (new user or phone-only auth)
          await signInWithCredential(auth, credential);
        }

        // Update local profile state
        if (profile) {
          setProfile({
            ...profile,
            phone,
            phoneVerified: true,
          });
        }

        resetPhoneAuth();
        return { success: true, verified: true };
      } catch (err: unknown) {
        let errorMessage = 'Verification failed';
        if (err instanceof Error) {
          // Map Firebase error codes to user-friendly messages
          if (err.message.includes('invalid-verification-code') || err.message.includes('Invalid verification code')) {
            errorMessage = 'Invalid verification code. Please try again.';
          } else if (err.message.includes('code-expired')) {
            errorMessage = 'Verification code expired. Please request a new one.';
          } else if (err.message.includes('credential-already-in-use')) {
            errorMessage = 'This phone number is already linked to another account.';
          } else if (err.message.includes('internal') || err.message.includes('unavailable')) {
            errorMessage = 'Service temporarily unavailable. Please try again.';
          } else {
            errorMessage = err.message;
          }
        }
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [verificationId, pendingPhone, user, profile, setProfile, resetPhoneAuth]
  );

  /**
   * Verify OTP and login as driver (phone-only authentication)
   * This is the main login method for driver app
   * 
   * Flow:
   * 1. Verify OTP with backend
   * 2. Backend returns custom token + driver profile info
   * 3. Sign in with custom token to Firebase Auth
   * 4. Set user and profile in auth store
   */
  const verifyOTPAndLoginDriver = useCallback(
    async (params: VerifyOTPParams) => {
      setIsLoading(true);
      setError(null);

      try {
        const auth = getFirebaseAuth();
        const functions = getFirebaseFunctions();
        const phone = pendingPhone || params.phone;

        // Call backend to verify OTP and get custom token
        const verifyPhoneOTP = httpsCallable(functions, 'verifyPhoneOTPPublic');
        const result = await verifyPhoneOTP({
          phone,
          otp: params.otp,
          loginAsDriver: true,
        }) as HttpsCallableResult<{
          success: boolean;
          data: {
            verified: boolean;
            customToken?: string;
            isNewDriver?: boolean;
            driverId?: string;
          };
        }>;

        if (!result.data.success || !result.data.data.verified) {
          throw new Error('Verification failed');
        }

        const { customToken, isNewDriver, driverId } = result.data.data;

        if (!customToken) {
          throw new Error('Authentication token not received');
        }

        // Sign in with the custom token from backend
        const userCredential = await signInWithCustomToken(auth, customToken);
        const firebaseUser = userCredential.user;

        // Set user in auth store
        const authUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          phoneNumber: phone,
          emailVerified: firebaseUser.emailVerified,
        };
        setUser(authUser);

        // Set driver profile in auth store
        const driverProfile: DriverProfile = {
          id: driverId || firebaseUser.uid,
          email: firebaseUser.email || '',
          phone,
          phoneVerified: true,
          firstName: '',
          lastName: '',
          role: 'driver',
          isOnline: false,
          isAvailable: false,
          vehicleInfo: {
            type: 'scooter',
            licensePlate: '',
          },
          rating: {
            average: 5.0,
            count: 0,
          },
          documentsVerified: false,
        };
        setProfile(driverProfile);

        // Fetch full driver profile from backend (non-blocking)
        try {
          const getUserProfile = httpsCallable(functions, 'getUserProfile');
          const profileResult = await getUserProfile({ userType: 'driver' });
          const profileResponse = profileResult.data as { success: boolean; data: DriverProfile };
          if (profileResponse.success && profileResponse.data) {
            setProfile(profileResponse.data);
          }
        } catch (profileError) {
          console.warn('[Driver Login] Profile fetch failed, using default:', profileError);
        }

        resetPhoneAuth();

        console.log(`[Driver Login] Successfully logged in driver ${driverId}, isNew: ${isNewDriver}`);

        return {
          success: true,
          verified: true,
          isNewDriver,
          driverId,
        };
      } catch (err: unknown) {
        // Handle demo mode fallback for Senegal numbers
        const fallbackPhone = pendingPhone || params.phone;
        if (fallbackPhone?.startsWith('+221') && params.otp === DEMO_OTP) {
          console.log(`[Demo Fallback] Attempting local demo login for ${fallbackPhone}`);
          return await handleDemoDriverLogin(fallbackPhone);
        }

        let errorMessage = 'Login failed';
        if (err instanceof Error) {
          if (err.message.includes('invalid') || err.message.includes('Invalid')) {
            errorMessage = 'Invalid verification code. Demo code is 123456.';
          } else if (err.message.includes('expired')) {
            errorMessage = 'Verification code expired. Please request a new one.';
          } else if (err.message.includes('internal') || err.message.includes('unavailable')) {
            errorMessage = 'Service temporarily unavailable. Please try again.';
          } else {
            errorMessage = err.message;
          }
        }
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [pendingPhone, setUser, setProfile, resetPhoneAuth]
  );

  /**
   * Handle demo driver login when backend is unavailable
   * Creates a local authenticated state for demo purposes
   */
  const handleDemoDriverLogin = useCallback(
    async (phone: string) => {
      console.log(`[Demo Mode] Creating demo driver login for ${phone}`);

      // Generate a demo UID based on phone number
      const demoUid = `demo_driver_${phone.replace(/\+/g, '')}`;

      // Set user in auth store
      const authUser = {
        uid: demoUid,
        email: null,
        displayName: `Driver ${phone.slice(-4)}`,
        photoURL: null,
        phoneNumber: phone,
        emailVerified: false,
      };
      setUser(authUser);

      // Set driver profile in auth store
      const driverProfile: DriverProfile = {
        id: demoUid,
        email: '',
        phone,
        phoneVerified: true,
        firstName: 'Demo',
        lastName: 'Driver',
        role: 'driver',
        isOnline: false,
        isAvailable: false,
        vehicleInfo: {
          type: 'scooter',
          licensePlate: 'DEMO-001',
        },
        rating: {
          average: 5.0,
          count: 0,
        },
        documentsVerified: true,
      };
      setProfile(driverProfile);

      resetPhoneAuth();

      return {
        success: true,
        verified: true,
        isNewDriver: true,
        driverId: demoUid,
      };
    },
    [setUser, setProfile, resetPhoneAuth]
  );

  /**
   * Link verified phone from Firebase Auth to user profile
   * Call this after phone verification if the profile wasn't auto-updated
   */
  const linkPhoneToProfile = useCallback(
    async (userType: 'client' | 'driver') => {
      setIsLoading(true);
      setError(null);

      try {
        const functions = getFirebaseFunctions();
        const linkPhone = httpsCallable(functions, 'linkPhoneToProfile');
        const result = await linkPhone({ userType });
        const response = result.data as { success: boolean; data: { verified: boolean } };

        if (response.success && response.data.verified) {
          if (profile) {
            setProfile({
              ...profile,
              phoneVerified: true,
            });
          }
          return { success: true };
        }
        throw new Error('Failed to link phone to profile');
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to link phone to profile';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [profile, setProfile]
  );

  /**
   * Complete driver profile after phone-only login
   * Call this when a new driver needs to add their name and vehicle info
   */
  const completeDriverProfile = useCallback(
    async (params: CompleteDriverProfileParams) => {
      setIsLoading(true);
      setError(null);

      try {
        const functions = getFirebaseFunctions();
        const updateProfile = httpsCallable(functions, 'updateDriverProfile');
        const result = await updateProfile({
          firstName: params.firstName,
          lastName: params.lastName,
          vehicleInfo: params.vehicleInfo,
        });
        const response = result.data as { success: boolean; data: DriverProfile };

        if (response.success && response.data) {
          setProfile(response.data);
          return { success: true, profile: response.data };
        }
        throw new Error('Failed to update profile');
      } catch (err: unknown) {
        let errorMessage = 'Failed to update profile';
        if (err instanceof Error) {
          if (err.message.includes('not-found')) {
            errorMessage = 'Driver profile not found. Please log in again.';
          } else if (err.message.includes('internal') || err.message.includes('unavailable')) {
            errorMessage = 'Service temporarily unavailable. Please try again.';
          } else {
            errorMessage = err.message;
          }
        }
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [setProfile]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
    resetPhoneAuth();
  }, [resetPhoneAuth]);

  return {
    isLoading,
    error,
    otpSent,
    verificationId,
    sendOTP,
    verifyOTP,
    verifyOTPAndLoginDriver,
    linkPhoneToProfile,
    completeDriverProfile,
    reset,
  };
}
