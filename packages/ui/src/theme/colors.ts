/**
 * Color Palette Definitions
 * RentAScooter Design System - Gildey Color Palette
 *
 * Primary: Golden Yellow - Warm, inviting, and energetic
 * Secondary: Vibrant Orange - Action-oriented, dynamic
 * Neutral: Navy/Charcoal - Professional, trustworthy
 */

import type {
  ColorScale,
  NeutralScale,
  SemanticColors,
  SurfaceColors,
  ThemeColors,
} from './types';

// =============================================================================
// PRIMARY - Golden Yellow
// =============================================================================
export const primaryColors: ColorScale = {
  100: '#FFF4C6',
  200: '#FFE888',
  300: '#FFD84A',
  400: '#FFC629',
  500: '#F9B208',
} as const;

// =============================================================================
// SECONDARY - Vibrant Orange
// =============================================================================
export const secondaryColors: ColorScale = {
  100: '#FFEDD5',
  200: '#FED7AA',
  300: '#FDBA74',
  400: '#FB923C',
  500: '#FF8A00',
} as const;

// =============================================================================
// NEUTRAL - Navy/Charcoal
// =============================================================================
export const neutralColors: NeutralScale = {
  100: '#E9ECEF',
  300: '#CED4DA',
  500: '#6B7280',
  700: '#343A40',
  900: '#1A1A2E',
} as const;

// =============================================================================
// SEMANTIC COLORS (Light Theme)
// =============================================================================
export const semanticColors: SemanticColors = {
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

// =============================================================================
// DARK THEME - PRIMARY (Golden Yellow - Inverted Scale)
// Darker values at 100, lighter at 500
// =============================================================================
export const darkPrimaryColors: ColorScale = {
  100: '#B76506',
  200: '#DD8B03',
  300: '#FFD84A',
  400: '#FFE888',
  500: '#FFF4C6',
} as const;

// =============================================================================
// DARK THEME - SECONDARY (Vibrant Orange - Inverted Scale)
// =============================================================================
export const darkSecondaryColors: ColorScale = {
  100: '#7C2D12',
  200: '#9A3412',
  300: '#EA580C',
  400: '#FF8A00',
  500: '#FDBA74',
} as const;

// =============================================================================
// DARK THEME - NEUTRAL (Navy/Charcoal - Inverted Scale)
// =============================================================================
export const darkNeutralColors: NeutralScale = {
  100: '#0F0F1E',
  300: '#1A1A2E',
  500: '#2D2D44',
  700: '#6B7280',
  900: '#F8F9FA',
} as const;

// =============================================================================
// DARK THEME - SEMANTIC COLORS
// =============================================================================
export const darkSemanticColors: SemanticColors = {
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
} as const;

// =============================================================================
// SURFACE COLORS
// =============================================================================
export const lightSurfaceColors: SurfaceColors = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  muted: '#F5F5F7',
  accent: '#FFF4C6',
} as const;

export const darkSurfaceColors: SurfaceColors = {
  background: '#0F0F1E',
  card: '#1A1A2E',
  muted: '#2D2D44',
  accent: '#3D3D58',
} as const;

// =============================================================================
// LIGHT THEME COLORS
// =============================================================================
export const lightColors: ThemeColors = {
  primary: primaryColors,
  secondary: secondaryColors,
  neutral: neutralColors,
  semantic: semanticColors,

  // Derived background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: neutralColors[100],
  },

  // Derived text colors
  text: {
    primary: neutralColors[900],
    secondary: neutralColors[700],
    tertiary: neutralColors[500],
    inverse: '#FFFFFF',
  },

  // Derived border colors
  border: {
    light: neutralColors[100],
    medium: neutralColors[300],
    dark: neutralColors[500],
  },

  // Status indicator colors
  status: {
    online: semanticColors.success,
    offline: neutralColors[500],
    busy: secondaryColors[500],
  },

  // Map route colors
  route: {
    primary: semanticColors.info,
    secondary: semanticColors.success,
  },

  // Surface colors
  surface: lightSurfaceColors,

  // Icon default color (dark for contrast on light backgrounds)
  icon: {
    default: '#242A37',
  },
} as const;

// =============================================================================
// LEGACY COMPATIBILITY COLORS
// Mapping new Gildey palette to legacy color structure for existing components
// =============================================================================
export const legacyColors = {
  // Primary colors - mapped from new palette
  primary: {
    main: primaryColors[400],
    light: primaryColors[200],
    dark: primaryColors[500],
  },
  secondary: {
    main: secondaryColors[400],
    light: secondaryColors[200],
    dark: secondaryColors[500],
  },
  accent: {
    main: semanticColors.error,
    light: '#FF4D52',
    dark: '#B3161C',
  },

  // Neutral colors
  background: lightColors.background,
  text: lightColors.text,
  border: lightColors.border,

  // Semantic colors (nested for component compatibility)
  semantic: semanticColors,

  // Semantic colors (flat for backward compatibility)
  success: semanticColors.success,
  warning: semanticColors.warning,
  error: semanticColors.error,
  info: semanticColors.info,

  // Status colors
  online: lightColors.status.online,
  offline: lightColors.status.offline,
  busy: lightColors.status.busy,

  // Map colors
  route: lightColors.route,

  // Icon colors
  icon: lightColors.icon,
} as const;

// =============================================================================
// DARK THEME COLORS
// Uses inverted color scales optimized for dark backgrounds
// =============================================================================
export const darkColors: ThemeColors = {
  primary: darkPrimaryColors,
  secondary: darkSecondaryColors,
  neutral: darkNeutralColors,
  semantic: darkSemanticColors,

  // Dark background colors
  background: {
    primary: darkNeutralColors[100],
    secondary: darkNeutralColors[300],
    tertiary: darkNeutralColors[500],
  },

  // Dark text colors (inverted for readability)
  text: {
    primary: darkNeutralColors[900],
    secondary: darkNeutralColors[700],
    tertiary: darkNeutralColors[500],
    inverse: darkNeutralColors[100],
  },

  // Dark border colors
  border: {
    light: darkNeutralColors[500],
    medium: darkNeutralColors[300],
    dark: darkNeutralColors[100],
  },

  // Status indicator colors (brighter for dark mode)
  status: {
    online: darkSemanticColors.success,
    offline: darkNeutralColors[700],
    busy: darkSecondaryColors[400],
  },

  // Map route colors
  route: {
    primary: darkSemanticColors.info,
    secondary: darkSemanticColors.success,
  },

  // Surface colors
  surface: darkSurfaceColors,

  // Icon default color (light for contrast on dark backgrounds)
  icon: {
    default: darkNeutralColors[900],
  },
} as const;
