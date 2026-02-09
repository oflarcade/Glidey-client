/**
 * Font Loading Hook
 * RentAScooter Design System
 *
 * Loads Roboto font family from Expo Google Fonts for consistent typography across apps
 */

import { useFonts as useExpoFonts } from 'expo-font';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_600SemiBold,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';

/**
 * Load Roboto fonts (Expo Google Fonts)
 *
 * @returns [fontsLoaded, fontError] tuple from expo-font
 *
 * @example
 * ```tsx
 * const [fontsLoaded, fontError] = useFonts();
 *
 * if (!fontsLoaded && !fontError) {
 *   return null; // Keep splash screen visible
 * }
 * ```
 */
export function useFonts() {
  return useExpoFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_600SemiBold,
    Roboto_700Bold,
  });
}
