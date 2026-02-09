import { Stack } from 'expo-router';

/**
 * Splash route group layout
 * Provides a clean navigation container for the splash screen
 */
export default function SplashLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        gestureEnabled: false,
      }}
    />
  );
}
