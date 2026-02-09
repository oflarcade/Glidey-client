/**
 * Theme Entry Point
 * RentAScooter Design System - Gildey Color Palette
 *
 * Provides theme context, provider, hook, and backward compatibility exports
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

// Type exports
export type {
  ColorScale,
  NeutralScale,
  SemanticColors,
  SurfaceColors,
  ThemeColors,
  BackgroundColors,
  TextColors,
  BorderColors,
  StatusColors,
  MapColors,
  IconColors,
  Spacing,
  BorderRadius,
  Typography,
  TypographyStyle,
  TypographyVariant,
  Shadows,
  ShadowStyle,
  Theme,
  ThemeContextValue,
} from './types';

// Color exports
export {
  // Light theme scales
  primaryColors,
  secondaryColors,
  neutralColors,
  semanticColors,
  // Dark theme scales
  darkPrimaryColors,
  darkSecondaryColors,
  darkNeutralColors,
  darkSemanticColors,
  // Surface colors
  lightSurfaceColors,
  darkSurfaceColors,
  // Complete theme colors
  lightColors,
  darkColors,
  legacyColors,
} from './colors';

// Token exports
export { spacing, borderRadius, typography, shadows } from './tokens';

// Font exports
export { fontFamilies, fontWeightToFamily } from '../fonts/fontFamilies';
export type { FontFamily, FontWeight } from '../fonts/fontFamilies';

// Import for internal use
import type { Theme, ThemeContextValue } from './types';
import { lightColors, darkColors, legacyColors } from './colors';
import { spacing, borderRadius, typography, shadows } from './tokens';

// =============================================================================
// THEME OBJECTS
// =============================================================================

/** Light theme - default theme */
export const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  borderRadius,
  typography,
  shadows,
} as const;

/** Dark theme - future implementation */
export const darkTheme: Theme = {
  colors: darkColors,
  spacing,
  borderRadius,
  typography,
  shadows,
} as const;

// =============================================================================
// THEME CONTEXT
// =============================================================================

const defaultContextValue: ThemeContextValue = {
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
};

export const ThemeContext = createContext<ThemeContextValue>(defaultContextValue);

// =============================================================================
// THEME PROVIDER
// =============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: 'light' | 'dark';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = 'light',
}) => {
  const [isDark, setIsDark] = useState(initialTheme === 'dark');

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const theme = isDark ? darkTheme : lightTheme;

  const value: ThemeContextValue = {
    theme,
    isDark,
    toggleTheme,
  };

  return React.createElement(ThemeContext.Provider, { value }, children);
};

// =============================================================================
// USE THEME HOOK
// =============================================================================

/**
 * Hook to access the current theme
 * @returns ThemeContextValue with theme, isDark flag, and toggleTheme function
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// =============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// These exports maintain compatibility with existing components
// =============================================================================

/**
 * @deprecated Use `lightColors` or `useTheme().theme.colors` instead
 * Legacy color object for backward compatibility
 */
export const colors = legacyColors;

/**
 * @deprecated Use `lightTheme` or `useTheme().theme` instead
 * Legacy theme object for backward compatibility
 */
export const theme = {
  colors: legacyColors,
  spacing,
  borderRadius,
  typography,
  shadows,
} as const;

// Legacy type export for backward compatibility
export type LegacyTheme = typeof theme;
