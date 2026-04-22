import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import fr from './locales/fr.json';

// Supported locales
export type SupportedLocale = 'fr' | 'en';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['fr', 'en'];

// Fallback when device language is neither fr nor en
export const DEFAULT_LOCALE: SupportedLocale = 'en';

// Storage key for persisted locale preference
const LOCALE_STORAGE_KEY = '@rentascooter/locale';

// Create i18n instance
const i18n = new I18n({
  en,
  fr,
});

// Configure i18n
i18n.defaultLocale = DEFAULT_LOCALE;
i18n.enableFallback = true;

/**
 * Detect the device locale and return a supported locale
 * Returns en if device language is not fr or en
 */
export function detectDeviceLocale(): SupportedLocale {
  const deviceLocale = Localization.getLocales()[0]?.languageCode;
  
  if (deviceLocale && SUPPORTED_LOCALES.includes(deviceLocale as SupportedLocale)) {
    return deviceLocale as SupportedLocale;
  }
  
  return DEFAULT_LOCALE;
}

/**
 * Get the persisted locale preference from AsyncStorage
 */
export async function getPersistedLocale(): Promise<SupportedLocale | null> {
  try {
    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
      return stored as SupportedLocale;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist the locale preference to AsyncStorage
 */
export async function persistLocale(locale: SupportedLocale): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Silently fail - not critical
  }
}

// Subscription mechanism so all useTranslation instances re-render on locale change
type LocaleListener = () => void;
const localeListeners = new Set<LocaleListener>();

export function subscribeToLocale(listener: LocaleListener): () => void {
  localeListeners.add(listener);
  return () => localeListeners.delete(listener);
}

function notifyLocaleListeners(): void {
  localeListeners.forEach((l) => l());
}

/**
 * Initialize the i18n instance with the appropriate locale
 * Priority: persisted preference > device locale > default (en)
 */
export async function initializeI18n(): Promise<SupportedLocale> {
  // First, check for persisted preference
  const persistedLocale = await getPersistedLocale();

  if (persistedLocale) {
    i18n.locale = persistedLocale;
    notifyLocaleListeners();
    return persistedLocale;
  }

  // Fall back to device locale detection (do not persist; only persist on user choice)
  const deviceLocale = detectDeviceLocale();
  i18n.locale = deviceLocale;
  notifyLocaleListeners();

  return deviceLocale;
}

/**
 * Set the current locale and persist it
 */
export async function setLocale(locale: SupportedLocale): Promise<void> {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    console.warn(`Unsupported locale: ${locale}. Falling back to ${DEFAULT_LOCALE}`);
    locale = DEFAULT_LOCALE;
  }

  i18n.locale = locale;
  notifyLocaleListeners();
  await persistLocale(locale);
}

/**
 * Get the current locale
 */
export function getCurrentLocale(): SupportedLocale {
  return i18n.locale as SupportedLocale;
}

/**
 * Translate a key with optional interpolation
 */
export function translate(
  key: string,
  options?: Record<string, string | number>
): string {
  return i18n.t(key, options);
}

/**
 * Check if a translation key exists
 */
export function hasTranslation(key: string): boolean {
  const translation = i18n.t(key, { defaultValue: '__MISSING__' });
  return translation !== '__MISSING__';
}

// Export the i18n instance for advanced usage
export { i18n };
