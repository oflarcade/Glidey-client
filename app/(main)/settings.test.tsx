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
    ListSheet: ({
      visible,
      children,
      title,
    }: {
      visible: boolean;
      children: React.ReactNode;
      title?: string;
    }) => (
      visible ? (
        <View>
          {title ? <Text>{title}</Text> : null}
          {children}
        </View>
      ) : null
    ),
  };
});

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocale = 'fr';
  });

  it('opens language sheet when language row is pressed', () => {
    const { getByText, getAllByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('settings.language'));

    expect(mockSetLocale).not.toHaveBeenCalled();
    expect(getAllByText('settings.language').length).toBeGreaterThan(1);
    expect(getAllByText('common.french').length).toBeGreaterThan(0);
    expect(getAllByText('common.english').length).toBeGreaterThan(0);
  });

  it('sets french when french option is selected', () => {
    const { getByText, getAllByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('settings.language'));
    fireEvent.press(getAllByText('common.french')[1]);

    expect(mockSetLocale).toHaveBeenCalledWith('fr');
  });

  it('sets english when english option is selected', () => {
    mockLocale = 'fr';
    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('settings.language'));
    fireEvent.press(getByText('common.english'));

    expect(mockSetLocale).toHaveBeenCalledWith('en');
  });
});
