const { version, buildNumber } = require('./version.json');
const easProjectId =
  process.env.EAS_PROJECT_ID || '4d0c5c52-4d7e-4a3d-a61b-4fee910cb563';

module.exports = {
  expo: {
    name: 'GLIDEY',
    slug: 'glidey-client',
    version,
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'glidey',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.glidey.client',
      buildNumber: String(buildNumber),
      config: {
        googleSignIn: {
          reservedClientId: process.env.GOOGLE_REVERSED_CLIENT_ID || 'YOUR_REVERSED_CLIENT_ID',
        },
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'We need your location to show nearby drivers and track your ride.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'We need your location to track your ride.',
        NSCameraUsageDescription: 'We need camera access for profile pictures.',
        NSPhotoLibraryUsageDescription:
          'We need photo library access for profile pictures.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
      package: 'com.glidey.client',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
      ],
      googleServicesFile: './google-services.json',
    },
    plugins: [
      [
        'expo-build-properties',
        {
          android: {
            kotlinVersion: '2.0.21',
          },
        },
      ],
      'expo-dev-client',
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/splash.png',
          imageWidth: 200,
          backgroundColor: '#FFFFFF',
          enableFullScreenImage_legacy: false,
        },
      ],
      'expo-location',
      //'expo-notifications',
      'expo-image-picker',
      'expo-localization',
      // Mapbox Maps SDK
      // For custom builds, optionally set RNMapboxMapsDownloadToken in ~/.gradle/gradle.properties (Android)
      // or ~/.netrc (iOS) - see docs/MAPBOX_SETUP.md for details
      [
        '@rnmapbox/maps',
        {
          // Download token for SDK (sk.xxx) - read from env or gradle.properties
          // Only needed for EAS builds or fresh native builds
          RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOADS_TOKEN,
        },
      ],
      '@react-native-google-signin/google-signin',
      // Strip Push Notifications entitlement so builds work with personal Apple Developer team
      './plugins/withoutPushEntitlement.js',
    ],
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: easProjectId,
      },
      buildNumber,
      version,
      /** Enable demo/mock data (mock drivers, etc.) in dev and EAS preview builds */
      useDemo: process.env.EXPO_PUBLIC_USE_DEMO === 'true',
    },
  },
};
