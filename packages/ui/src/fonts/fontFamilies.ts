/**
 * Font Family Definitions
 * RentAScooter Design System
 *
 * Using Roboto from Expo Google Fonts across all platforms for consistent typography
 */

/**
 * Font family names as registered by @expo-google-fonts/roboto
 * These must match the keys used in useFonts()
 */
export const fontFamilies = {
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  semiBold: 'Roboto_600SemiBold',
  bold: 'Roboto_700Bold',
} as const;

/**
 * Font weight to family mapping for consistent usage
 */
export const fontWeightToFamily: Record<string, string> = {
  '400': fontFamilies.regular,
  '500': fontFamilies.medium,
  '600': fontFamilies.semiBold,
  '700': fontFamilies.bold,
  normal: fontFamilies.regular,
  bold: fontFamilies.bold,
};

export type FontFamily = (typeof fontFamilies)[keyof typeof fontFamilies];
export type FontWeight = '400' | '500' | '600' | '700';
