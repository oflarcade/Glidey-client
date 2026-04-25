import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SettingsScreen from './settings';

const mockBack = jest.fn();
const mockLogout = jest.fn();
const mockSetLocale = jest.fn();

let mockLocale: 'fr' | 'en' = 'fr';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

jest.mock('@rentascooter/auth', () => ({
  useAuth: () => ({
    logout: mockLogout,
  }),
}));

jest.mock('@rentascooter/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: mockLocale,
    setLocale: mockSetLocale,
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    name: 'Glidey',
    version: '1.0.0',
  },
}));

jest.mock('@rentascooter/ui', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return {
    TopBar: ({ title, leftAction }: { title: string; leftAction?: React.ReactNode }) => (
      <View>
        <Text>{title}</Text>
        {leftAction}
      </View>
    ),
    Icon: () => <Text>icon</Text>,
  };
});

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocale = 'fr';
  });

  it('toggles language from french to english when language row is pressed', () => {
    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('settings.language'));

    expect(mockSetLocale).toHaveBeenCalledWith('en');
  });

  it('toggles language from english to french when language row is pressed', () => {
    mockLocale = 'en';
    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('settings.language'));

    expect(mockSetLocale).toHaveBeenCalledWith('fr');
  });
});
