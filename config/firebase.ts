import type { FirebaseConfig } from '@rentascooter/auth';

// Firebase configuration for RentAScooter Client App (com.glidey.client)
export const firebaseConfig: FirebaseConfig = {
  apiKey: 'AIzaSyCJzev8wEpS6tLfIv8AU9Aj0Xu8Mg904qg',
  authDomain: 'auth-bf4f5.firebaseapp.com',
  projectId: 'auth-bf4f5',
  storageBucket: 'auth-bf4f5.firebasestorage.app',
  messagingSenderId: '258292595627',
  appId: '1:258292595627:android:0514da61bf4f944fda30ee',
};

// Mapbox config
export const mapboxConfig = {
  accessToken: 'YOUR_MAPBOX_ACCESS_TOKEN',
};

// Google Sign-In config for OAuth
export const googleConfig = {
  webClientId: '258292595627-pvsqp8h5d3d5qlc08q9uonh07q678dk5.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', // Add when iOS app is configured in Firebase
};
