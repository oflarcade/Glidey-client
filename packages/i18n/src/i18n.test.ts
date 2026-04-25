jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

import { initializeI18n, setLocale, translate } from './i18n';

describe('i18n interpolation', () => {
  beforeEach(async () => {
    await initializeI18n();
  });

  it('interpolates auth resend timer in english locale', async () => {
    await setLocale('en');

    expect(translate('auth.resend_in', { seconds: 30 })).toBe('Resend in 30s');
  });

  it('interpolates auth resend timer in french locale', async () => {
    await setLocale('fr');

    expect(translate('auth.resend_in', { seconds: 30 })).toBe('Renvoyer dans 30s');
  });
});
