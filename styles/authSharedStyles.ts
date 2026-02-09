import { StyleSheet, Platform, ViewStyle } from 'react-native';
import { colors } from '@rentascooter/ui/theme';

/**
 * Shared styles for authentication screens
 * Provides consistent styling across login, register, and other auth screens
 */
export const authSharedStyles = StyleSheet.create({
  authInputFieldShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  } as ViewStyle,

  linkWrapper: {
    borderBottomWidth: 1,
    // Use primary[400] (#FFC629) which is closest to the original #FECB00
    // Accessing colors.primary as ColorScale which has numeric keys
    borderBottomColor: colors.primary[400] || '#FECB00',
  },

  bottomText: {
    fontSize: 18,
  },

  linkText: {
    fontWeight: '600',
    color: colors.text.primary,
    fontSize: 18,
  },
});
