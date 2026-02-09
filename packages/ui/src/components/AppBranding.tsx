import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';

import { AppLogo } from './AppLogo';
import type { AppLogoProps } from './AppLogo';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Brand text color - dark navy */
const BRAND_TEXT_COLOR = '#1A1A2E';

/** Brand titles */
const BRAND_TITLES = {
  client: 'GLIDEY',
  driver: 'GLIDEY DRIVER',
} as const;

// =============================================================================
// TYPES
// =============================================================================

/**
 * AppBranding Props
 *
 * @acceptance AC-ABR-001: Shows "GLIDEY" text for client variant
 * @acceptance AC-ABR-002: Shows "GLIDEY DRIVER" text for driver variant
 * @acceptance AC-ABR-003: Supports vertical and horizontal layouts
 */
export interface AppBrandingProps {
  /** Brand variant - determines logo and text */
  variant?: 'driver' | 'client';
  /** Layout direction */
  layout?: 'vertical' | 'horizontal';
  /** Logo size preset */
  logoSize?: AppLogoProps['size'];
  /** Custom style overrides */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * AppBranding Component
 *
 * Displays the Glidey logo with brand text.
 * Used for splash screens, headers, and branding across apps.
 *
 * @example
 * // Default vertical branding
 * <AppBranding />
 *
 * @example
 * // Driver variant with horizontal layout
 * <AppBranding variant="driver" layout="horizontal" />
 *
 * @example
 * // Large logo for splash screen
 * <AppBranding logoSize="xl" />
 */
export const AppBranding: React.FC<AppBrandingProps> = ({
  variant = 'client',
  layout = 'vertical',
  logoSize = 'lg',
  style,
  testID = 'app-branding',
}) => {
  const title = BRAND_TITLES[variant];
  const isVertical = layout === 'vertical';

  return (
    <View
      style={[
        styles.container,
        isVertical ? styles.verticalLayout : styles.horizontalLayout,
        style,
      ]}
      testID={testID}
      accessibilityLabel={`${title} branding`}
      accessibilityRole="header"
    >
      <AppLogo
        variant={variant}
        size={logoSize}
        testID={`${testID}-logo`}
      />
      <Text
        style={[
          styles.title,
          isVertical ? styles.titleVertical : styles.titleHorizontal,
        ]}
        testID={`${testID}-title`}
      >
        {title}
      </Text>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  verticalLayout: {
    flexDirection: 'column',
    gap: 24,
  },
  horizontalLayout: {
    flexDirection: 'row',
    gap: 16,
  },
  title: {
    fontFamily: 'Roboto_700Bold',
    fontWeight: '700',
    color: BRAND_TEXT_COLOR,
    letterSpacing: -0.5,
  },
  titleVertical: {
    fontSize: 32,
    textAlign: 'center',
  },
  titleHorizontal: {
    fontSize: 24,
  },
});

export default AppBranding;
