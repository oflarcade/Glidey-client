import { useCallback, useState } from 'react';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseAuth, getFirebaseFunctions } from '../firebase';
import { useAuthStore } from '../store';
import type { AuthUser } from '../types';

interface GoogleAuthConfig {
  webClientId: string;
  iosClientId?: string;
  offlineAccess?: boolean;
}

/**
 * Hook for Google Sign-In (used by client app)
 */
export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, setProfile, appType } = useAuthStore();

  // Configure Google Sign-In (call once at app start)
  const configure = useCallback((config: GoogleAuthConfig) => {
    GoogleSignin.configure({
      webClientId: config.webClientId,
      iosClientId: config.iosClientId,
      offlineAccess: config.offlineAccess ?? true,
    });
  }, []);

  // Sign in with Google
  const signIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if Play Services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in and get tokens
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Create Firebase credential and sign in
      const credential = GoogleAuthProvider.credential(idToken);
      const auth = getFirebaseAuth();
      const result = await signInWithCredential(auth, credential);

      const authUser: AuthUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        phoneNumber: result.user.phoneNumber,
        emailVerified: result.user.emailVerified,
      };

      setUser(authUser);

      // Check if profile exists, if not create one
      const functions = getFirebaseFunctions();
      const getUserProfile = httpsCallable(functions, 'getUserProfile');

      try {
        const profileResult = await getUserProfile({ userType: appType });
        const response = profileResult.data as { success: boolean; data: unknown };

        if (response.success && response.data) {
          setProfile(response.data as Parameters<typeof setProfile>[0]);
        }
      } catch {
        // Profile doesn't exist, create it
        const nameParts = (result.user.displayName || '').split(' ');
        const createClientProfile = httpsCallable(functions, 'createClientProfile');
        await createClientProfile({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
        });

        // Fetch the newly created profile
        const newProfileResult = await getUserProfile({ userType: appType });
        const newResponse = newProfileResult.data as { success: boolean; data: unknown };
        if (newResponse.success && newResponse.data) {
          setProfile(newResponse.data as Parameters<typeof setProfile>[0]);
        }
      }

      return { success: true, user: authUser };
    } catch (err: unknown) {
      let errorMessage = 'Google sign-in failed';

      if (err && typeof err === 'object' && 'code' in err) {
        const googleError = err as { code: string; message?: string };
        switch (googleError.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            errorMessage = 'Sign-in was cancelled';
            break;
          case statusCodes.IN_PROGRESS:
            errorMessage = 'Sign-in is already in progress';
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            errorMessage = 'Play Services not available';
            break;
          default:
            errorMessage = googleError.message || errorMessage;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [appType, setUser, setProfile]);

  // Sign out from Google
  const signOut = useCallback(async () => {
    try {
      await GoogleSignin.signOut();
      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  // Check if user is signed in to Google
  const isSignedIn = useCallback(async () => {
    return await GoogleSignin.isSignedIn();
  }, []);

  return {
    isLoading,
    error,
    configure,
    signIn,
    signOut,
    isSignedIn,
  };
}
