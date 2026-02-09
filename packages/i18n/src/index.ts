// Main i18n exports
export {
  i18n,
  initializeI18n,
  setLocale,
  getCurrentLocale,
  translate,
  detectDeviceLocale,
  getPersistedLocale,
  persistLocale,
  hasTranslation,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  type SupportedLocale,
} from './i18n';

// React hook exports
export {
  useTranslation,
  getTranslation,
  type UseTranslationReturn,
} from './useTranslation';

// Locale files for direct import if needed
export { default as enLocale } from './locales/en.json';
export { default as frLocale } from './locales/fr.json';
