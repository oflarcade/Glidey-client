import type { ViewStyle } from 'react-native';
import type { CountryCode } from '@rentascooter/shared';

export interface PhoneLoginCardProps {
  /** Card title - defaults to "Login" (bold) + "with your phone number" */
  title?: string;
  /** Currently selected country */
  selectedCountry: CountryCode;
  /** List of available countries */
  countries: CountryCode[];
  /** Callback when country changes */
  onCountryChange: (country: CountryCode) => void;
  /** Current phone number value (without country code) */
  phoneNumber: string;
  /** Callback when phone number changes */
  onPhoneNumberChange: (value: string) => void;
  /** Callback when submit button is pressed */
  onSubmit: () => void;
  /** Callback when sign up link is pressed */
  onSignUpPress: () => void;
  /** Submit button label - defaults to "NEXT" */
  submitLabel?: string;
  /** Sign up prompt text - defaults to "Don't have an account?" */
  signUpPromptText?: string;
  /** Sign up link text - defaults to "Sign Up" */
  signUpLinkText?: string;
  /** Loading state for submit button */
  loading?: boolean;
  /** Disable the entire form */
  disabled?: boolean;
  /** Error message to display below input */
  error?: string;
  /** Custom header component (replaces default skyline) */
  headerComponent?: React.ReactNode;
  /** Container style override */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

export interface CountryCodePickerProps {
  /** Currently selected country */
  selectedCountry: CountryCode;
  /** List of available countries */
  countries: CountryCode[];
  /** Callback when country is selected */
  onSelect: (country: CountryCode) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Test ID */
  testID?: string;
}

export interface PhoneInputProps {
  /** Phone number value */
  value: string;
  /** Callback when value changes */
  onChangeText: (value: string) => void;
  /** Selected country for display */
  selectedCountry: CountryCode;
  /** Countries for picker */
  countries: CountryCode[];
  /** Callback when country changes */
  onCountryChange: (country: CountryCode) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Error state */
  hasError?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Test ID */
  testID?: string;
}
