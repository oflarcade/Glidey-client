import React from 'react';
import { render } from '@testing-library/react-native';

import VerifySmsScreen from './verify-sms';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    phone: '+221771234567',
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
}));

jest.mock('@rentascooter/auth', () => ({
  usePhoneAuth: () => ({
    verifyOTP: jest.fn(),
    sendOTP: jest.fn(),
    isLoading: false,
  }),
}));

jest.mock('@rentascooter/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string | number>) => {
      if (key === 'auth.resend_in') {
        return `Resend in ${options?.seconds ?? '??'}s`;
      }

      return key;
    },
  }),
}));

jest.mock('@rentascooter/ui', () => {
  const ReactLocal = require('react');
  const { Text, View, Pressable } = require('react-native');

  return {
    Text: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
    Button: ({ title, onPress }: { title: string; onPress: () => void }) => (
      <Pressable onPress={onPress}>
        <Text>{title}</Text>
      </Pressable>
    ),
    Card: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    TopBar: ({ title }: { title: string }) => <Text>{title}</Text>,
    AppBranding: () => <View accessibilityLabel="app-branding" />,
  };
});

describe('VerifySmsScreen', () => {
  it('renders resend timer using interpolation key and seconds value', () => {
    const { getByText } = render(<VerifySmsScreen />);

    expect(getByText('Resend in 30s')).toBeTruthy();
  });
});
