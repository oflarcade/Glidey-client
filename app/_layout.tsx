import 'react-native-get-random-values'; // Must be first for uuid/crypto in RN
import 'react-native-reanimated';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MapboxGL from '@rnmapbox/maps';
import { initializeFirebase, useAuthStore } from '@rentascooter/auth';
import { useTranslation } from '@rentascooter/i18n';
import { useFonts } from '@rentascooter/ui';
import { colors } from '@rentascooter/ui/theme';
import { firebaseConfig, mapboxConfig } from '@/config/firebase';

// Initialize Mapbox
// Priority: 1. Environment variable (for CI/CD and different environments)
//           2. Config file (for local development)
// IMPORTANT: Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env OR update mapboxConfig in config/firebase.ts
const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || mapboxConfig.accessToken;

// Validate token and warn if missing
if (!mapboxToken || mapboxToken === 'YOUR_MAPBOX_ACCESS_TOKEN') {
  console.warn(
    '⚠️ [Mapbox] Access token not configured!\n' +
    'The map will show a black screen until you:\n' +
    '1. Create a token at https://account.mapbox.com/access-tokens/\n' +
    '2. Add to .env: EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token\n' +
    '   OR update apps/client/config/firebase.ts mapboxConfig.accessToken'
  );
} else if (__DEV__) {
  console.log('✅ [Mapbox] Token configured');
}

MapboxGL.setAccessToken(mapboxToken || '');
MapboxGL.setTelemetryEnabled(false); // Privacy: Disable telemetry

// Keep expo splash screen visible until our custom splash screen takes over
SplashScreen.preventAutoHideAsync();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const { setAppType } = useAuthStore();
  const [fontsLoaded, fontError] = useFonts();
  const { isReady: i18nReady } = useTranslation();

  useEffect(() => {
    // Initialize Firebase
    initializeFirebase({
      config: firebaseConfig,
      appType: 'client',
      useEmulator: false, // Connect to deployed Firebase backend
    });

    // Set app type
    setAppType('client');
  }, [setAppType]);

  // Wait for fonts and i18n to load before rendering
  // The custom splash screen will hide the expo splash screen
  if ((!fontsLoaded && !fontError) || !i18nReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(splash)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(main)" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});
