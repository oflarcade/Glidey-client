import { useSyncExternalStore, useEffect, useCallback, useState } from 'react';
import {
  initializeI18n,
  setLocale as setI18nLocale,
  getCurrentLocale,
  subscribeToLocale,
  translate,
  type SupportedLocale,
  SUPPORTED_LOCALES,
} from './i18n';

export interface UseTranslationReturn {
  /**
   * Translation function - use to translate keys
   * @param key - Translation key (e.g., 'common.welcome', 'auth.login')
   * @param options - Optional interpolation values
   */
  t: (key: string, options?: Record<string, string | number>) => string;
  
  /**
   * Current locale
   */
  locale: SupportedLocale;
  
  /**
   * Set the locale and persist it
   */
  setLocale: (locale: SupportedLocale) => Promise<void>;
  
  /**
   * Whether the i18n system is initialized
   */
  isReady: boolean;
  
  /**
   * List of supported locales
   */
  supportedLocales: SupportedLocale[];
}

/**
 * React hook for translations
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { t, locale, setLocale, isReady } = useTranslation();
 *   
 *   if (!isReady) return <Loading />;
 *   
 *   return (
 *     <View>
 *       <Text>{t('common.welcome')}</Text>
 *       <Text>{t('currency.format', { amount: 5000 })}</Text>
 *       <Button onPress={() => setLocale('en')} title="English" />
 *     </View>
 *   );
 * }
 * ```
 */
export function useTranslation(): UseTranslationReturn {
  // useSyncExternalStore ensures every hook instance re-renders when locale changes,
  // regardless of which component triggered the change.
  const locale = useSyncExternalStore(subscribeToLocale, getCurrentLocale, getCurrentLocale);
  const [isReady, setIsReady] = useState(false);

  // Initialize i18n on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      await initializeI18n();
      if (mounted) {
        setIsReady(true);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Translation function that triggers re-render when locale changes
  const t = useCallback(
    (key: string, options?: Record<string, string | number>): string => {
      return translate(key, options);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale] // Re-create when locale changes to trigger re-render
  );

  // Set locale function — notifyLocaleListeners() is called inside setI18nLocale
  const setLocale = useCallback(async (newLocale: SupportedLocale) => {
    await setI18nLocale(newLocale);
  }, []);

  return {
    t,
    locale,
    setLocale,
    isReady,
    supportedLocales: SUPPORTED_LOCALES,
  };
}

/**
 * Get the translation function outside of React components
 * Note: This won't trigger re-renders when locale changes
 */
export function getTranslation() {
  return {
    t: translate,
    locale: getCurrentLocale(),
  };
}
