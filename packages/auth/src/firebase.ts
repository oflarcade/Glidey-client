import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  Auth,
} from 'firebase/auth';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppType } from './types';

/**
 * Cloud Functions region
 * Must match the region configured in backend/functions/src/config.ts
 * Using europe-west1 (Belgium) - closest GCP region to Senegal/West Africa
 */
const FUNCTIONS_REGION = 'europe-west1';

// Firebase config will be set per app
let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let functions: Functions | null = null;
let firestore: Firestore | null = null;

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface InitializeFirebaseOptions {
  config: FirebaseConfig;
  appType: AppType;
  useEmulator?: boolean;
  emulatorHost?: string;
}

/**
 * Initialize Firebase for the app
 * Call this once at app startup
 */
export function initializeFirebase(options: InitializeFirebaseOptions): void {
  const { config, useEmulator = false, emulatorHost = 'localhost' } = options;

  if (getApps().length === 0) {
    firebaseApp = initializeApp(config);

    // Initialize Auth with React Native persistence
    auth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

    // Use europe-west1 region for production, no region for emulator
    functions = useEmulator
      ? getFunctions(firebaseApp)
      : getFunctions(firebaseApp, FUNCTIONS_REGION);
    firestore = getFirestore(firebaseApp);

    // Connect to emulators in development
    if (useEmulator) {
      connectFunctionsEmulator(functions, emulatorHost, 5001);
      connectFirestoreEmulator(firestore, emulatorHost, 8080);
    }
  } else {
    firebaseApp = getApps()[0];
    auth = getAuth(firebaseApp);
    // Use europe-west1 region for production
    functions = getFunctions(firebaseApp, FUNCTIONS_REGION);
    firestore = getFirestore(firebaseApp);
  }
}

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized. Call initializeFirebase first.');
  }
  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Call initializeFirebase first.');
  }
  return auth;
}

export function getFirebaseFunctions(): Functions {
  if (!functions) {
    throw new Error('Firebase Functions not initialized. Call initializeFirebase first.');
  }
  return functions;
}

export function getFirebaseFirestore(): Firestore {
  if (!firestore) {
    throw new Error('Firebase Firestore not initialized. Call initializeFirebase first.');
  }
  return firestore;
}
