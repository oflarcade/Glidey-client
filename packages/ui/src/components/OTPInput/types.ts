/**
 * OTPInput Component Types
 * RentAScooter Design System
 *
 * @acceptance AC-OTP-001: OTP input displays correct number of digit boxes
 * @acceptance AC-OTP-002: Auto-focus moves to next input on digit entry
 * @acceptance AC-OTP-003: Backspace moves focus to previous input
 * @acceptance AC-OTP-004: Paste of full code fills all inputs
 * @acceptance AC-OTP-005: Error state displays red border and error message
 * @acceptance AC-OTP-006: Filled inputs show digit with proper styling
 */

import type { ViewStyle, TextStyle } from 'react-native';

export interface OTPInputProps {
  /** Current OTP value as string */
  value: string;
  /** Callback when OTP value changes */
  onChange: (value: string) => void;
  /** Number of OTP digits (default: 4) */
  length?: number;
  /** Error message to display */
  error?: string;
  /** Auto-focus first input on mount */
  autoFocus?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Secure text entry (show dots instead of numbers) */
  secureTextEntry?: boolean;
  /** Custom container style */
  containerStyle?: ViewStyle;
  /** Custom input box style */
  inputStyle?: ViewStyle;
  /** Custom text style for digits */
  textStyle?: TextStyle;
  /** Test ID for testing */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export interface OTPInputRef {
  /** Focus the first empty input or last input */
  focus: () => void;
  /** Clear all inputs and focus first */
  clear: () => void;
}
