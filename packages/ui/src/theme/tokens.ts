/**
 * Design Tokens
 * RentAScooter Design System
 *
 * Spacing, border radius, typography, and shadow definitions
 */

import type { Spacing, BorderRadius, Typography, Shadows } from './types';
import { fontFamilies } from '../fonts/fontFamilies';

// =============================================================================
// SPACING
// Base unit: 4px
// =============================================================================
export const spacing: Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================
export const borderRadius: BorderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// =============================================================================
// TYPOGRAPHY
// Font family: Roboto (Expo Google Fonts)
// Design spec alignment:
//   - Heading 1 (Large Title): 24px, Medium
//   - Heading 2 (Section Title): 20px, Medium
//   - Heading 3 (Card Title): 18px, Medium
//   - Heading 4 (Small Title): 16px, Medium
//   - Body Text: 16px, Normal
//   - Small Text: 14px, Normal
// =============================================================================
export const typography: Typography = {
  h1: {
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 32,
    fontFamily: fontFamilies.medium,
  },
  h2: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
    fontFamily: fontFamilies.medium,
  },
  h3: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
    fontFamily: fontFamilies.medium,
  },
  h4: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    fontFamily: fontFamilies.medium,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    fontFamily: fontFamilies.regular,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    fontFamily: fontFamilies.regular,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    fontFamily: fontFamilies.regular,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    fontFamily: fontFamilies.semiBold,
  },
} as const;

// =============================================================================
// SHADOWS
// Platform-specific shadow styles (iOS shadowX properties + Android elevation)
// =============================================================================
export const shadows: Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;
