/**
 * Theme Type Definitions
 * RentAScooter Design System - Gildey Color Palette
 */

/** Color scale for primary and secondary palettes (100-500) */
export interface ColorScale {
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
}

/** Neutral color scale (100, 300, 500, 700, 900) */
export interface NeutralScale {
  100: string;
  300: string;
  500: string;
  700: string;
  900: string;
}

/** Semantic colors for status and feedback */
export interface SemanticColors {
  success: string;
  warning: string;
  error: string;
  info: string;
}

/** Background color variants */
export interface BackgroundColors {
  primary: string;
  secondary: string;
  tertiary: string;
}

/** Text color variants */
export interface TextColors {
  primary: string;
  secondary: string;
  tertiary: string;
  inverse: string;
}

/** Border color variants */
export interface BorderColors {
  light: string;
  medium: string;
  dark: string;
}

/** Status indicator colors */
export interface StatusColors {
  online: string;
  offline: string;
  busy: string;
}

/** Map-specific colors */
export interface MapColors {
  primary: string;
  secondary: string;
}

/** Icon default color (e.g. for list/menu icons) */
export interface IconColors {
  default: string;
}

/** Surface colors for cards, backgrounds, and UI layers */
export interface SurfaceColors {
  background: string;
  card: string;
  muted: string;
  accent: string;
}

/** Complete theme colors structure */
export interface ThemeColors {
  primary: ColorScale;
  secondary: ColorScale;
  neutral: NeutralScale;
  semantic: SemanticColors;
  background: BackgroundColors;
  text: TextColors;
  border: BorderColors;
  status: StatusColors;
  route: MapColors;
  surface: SurfaceColors;
  icon: IconColors;
}

/** Spacing scale */
export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

/** Border radius scale */
export interface BorderRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

/** Typography style definition */
export interface TypographyStyle {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700';
  lineHeight: number;
  fontFamily: string;
}

/** Typography scale */
export interface Typography {
  h1: TypographyStyle;
  h2: TypographyStyle;
  h3: TypographyStyle;
  h4: TypographyStyle;
  body: TypographyStyle;
  bodySmall: TypographyStyle;
  caption: TypographyStyle;
  button: TypographyStyle;
}

/** Typography variant keys for Text component */
export type TypographyVariant = keyof Omit<Typography, 'button'>;

/** Shadow style definition */
export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

/** Shadow scale */
export interface Shadows {
  small: ShadowStyle;
  medium: ShadowStyle;
  large: ShadowStyle;
}

/** Complete theme structure */
export interface Theme {
  colors: ThemeColors;
  spacing: Spacing;
  borderRadius: BorderRadius;
  typography: Typography;
  shadows: Shadows;
}

/** Theme context value */
export interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}
